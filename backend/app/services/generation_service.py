import uuid
import asyncio
from datetime import datetime
from typing import Dict, Optional, List
from fastapi import HTTPException, status
import replicate

from app.config import settings
from app.models.generation import GenerationRequest, GenerationResponse, GenerationJob, ReplicatePrediction
from app.services.database_service import database_service


class GenerationService:
    """Service for handling image generation requests."""
    
    def __init__(self):
        # In-memory storage for demo purposes
        # In production, this would be a database or queue system
        self.jobs: Dict[str, GenerationJob] = {}
        
        # Default models available for generation
        self.available_models = [
            "black-forest-labs/flux-schnell"
        ]
        self.default_model = "black-forest-labs/flux-schnell"
        
        # Initialize Replicate client
        self.replicate_client = replicate.Client(api_token=settings.replicate_api_token)
    
    def generate_job_id(self) -> str:
        """Generate a unique UUID for the job."""
        return str(uuid.uuid4())
    
    def get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        return datetime.utcnow().isoformat() + "Z"
    
    def validate_model(self, model: Optional[str]) -> str:
        """
        Validate and return the model to use.
        
        Args:
            model: Optional model name from request
            
        Returns:
            Valid model name to use
            
        Raises:
            HTTPException: If model is not supported
        """
        if model is None:
            return self.default_model
        
        if model not in self.available_models:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Model '{model}' is not supported. Available models: {', '.join(self.available_models)}"
            )
        
        return model
    
    def create_replicate_prediction(self, prompt: str, job_id: str) -> ReplicatePrediction:
        """
        Create a single Replicate prediction.
        
        Args:
            prompt: Text prompt for image generation
            job_id: Job ID for tracking
            
        Returns:
            ReplicatePrediction object with prediction details
            
        Raises:
            HTTPException: If Replicate API call fails
        """
        try:
            # Create prediction using Replicate API
            # Based on https://replicate.com/docs
            prediction = self.replicate_client.predictions.create(
                model=settings.replicate_model,
                input={
                    "prompt": prompt,
                    "aspect_ratio": "1:1",
                    "output_format": "webp",
                    "output_quality": 80,
                    "safety_tolerance": 2,
                    "prompt_upsampling": True
                }
            )
            
            return ReplicatePrediction(
                prediction_id=prediction.id,
                status=prediction.status,
                image_url=None,  # Will be populated when completed
                error=None,
                created_at=self.get_current_timestamp(),
                completed_at=None
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create Replicate prediction: {str(e)}"
            )
    
    async def create_generation_job(self, request: GenerationRequest) -> GenerationResponse:
        """
        Create a new image generation job and trigger Replicate predictions.
        
        Args:
            request: Generation request with prompt, num_images, and optional model
            
        Returns:
            GenerationResponse with job_id
        """
        # Generate unique job ID
        job_id = self.generate_job_id()
        
        # Validate and set model
        validated_model = self.validate_model(request.model)
        
        # Create job record
        job = GenerationJob(
            job_id=job_id,
            prompt=request.prompt,
            num_images=request.num_images,
            model=validated_model,
            status="pending",
            created_at=self.get_current_timestamp(),
            predictions=[],
            completed_images=0,
            failed_images=0
        )
        
        # Store job first
        self.jobs[job_id] = job
        
        # Create N Replicate predictions (one for each requested image)
        predictions = []
        failed_predictions = 0
        
        for i in range(request.num_images):
            try:
                prediction = self.create_replicate_prediction(request.prompt, job_id)
                predictions.append(prediction)
            except HTTPException as e:
                failed_predictions += 1
                # Log error but continue with other predictions
                print(f"Failed to create prediction {i+1} for job {job_id}: {e.detail}")
        
        # Update job with predictions
        job.predictions = predictions
        job.failed_images = failed_predictions
        
        # Update status based on results
        if len(predictions) == 0:
            job.status = "failed"
        elif failed_predictions > 0:
            job.status = "partial"
        else:
            job.status = "processing"
        
        # Update stored job
        self.jobs[job_id] = job
        
        # Save job and predictions to database
        if len(predictions) > 0:
            try:
                await database_service.save_job_predictions(job_id, predictions)
                print(f"Successfully saved {len(predictions)} predictions for job {job_id} to database")
            except HTTPException as e:
                print(f"Failed to save job {job_id} to database: {e.detail}")
                # Don't fail the entire request if database save fails
        
        return GenerationResponse(job_id=job_id)
    
    def update_job_from_replicate(self, job_id: str) -> None:
        """
        Update job status by checking Replicate predictions.
        
        Args:
            job_id: The job ID to update
        """
        job = self.jobs.get(job_id)
        if not job:
            return
        
        updated_predictions = []
        completed_count = 0
        failed_count = 0
        
        for prediction in job.predictions:
            try:
                # Get latest prediction status from Replicate
                replicate_prediction = self.replicate_client.predictions.get(prediction.prediction_id)
                
                # Update prediction details
                updated_prediction = ReplicatePrediction(
                    prediction_id=prediction.prediction_id,
                    status=replicate_prediction.status,
                    image_url=replicate_prediction.output[0] if replicate_prediction.output else None,
                    error=replicate_prediction.error if hasattr(replicate_prediction, 'error') else None,
                    created_at=prediction.created_at,
                    completed_at=self.get_current_timestamp() if replicate_prediction.status in ["succeeded", "failed"] else None
                )
                
                updated_predictions.append(updated_prediction)
                
                # Count completed and failed
                if replicate_prediction.status == "succeeded":
                    completed_count += 1
                elif replicate_prediction.status == "failed":
                    failed_count += 1
                    
            except Exception as e:
                # Keep original prediction if update fails
                updated_predictions.append(prediction)
                print(f"Failed to update prediction {prediction.prediction_id}: {e}")
        
        # Update job with new prediction statuses
        job.predictions = updated_predictions
        job.completed_images = completed_count
        job.failed_images = failed_count
        
        # Update overall job status
        total_predictions = len(job.predictions)
        if completed_count == total_predictions:
            job.status = "completed"
            job.completed_at = self.get_current_timestamp()
        elif failed_count == total_predictions:
            job.status = "failed"
            job.completed_at = self.get_current_timestamp()
        elif completed_count + failed_count == total_predictions:
            job.status = "partial"
            job.completed_at = self.get_current_timestamp()
        else:
            job.status = "processing"
        
        # Update stored job
        self.jobs[job_id] = job
    
    def get_job_status(self, job_id: str) -> Optional[GenerationJob]:
        """
        Get the status of a generation job, updating from Replicate if needed.
        
        Args:
            job_id: The job ID to check
            
        Returns:
            GenerationJob if found, None otherwise
        """
        job = self.jobs.get(job_id)
        if job and job.status in ["processing", "partial"]:
            # Update job status from Replicate if still in progress
            self.update_job_from_replicate(job_id)
            job = self.jobs.get(job_id)
        
        return job
    
    def get_all_jobs(self) -> Dict[str, GenerationJob]:
        """
        Get all generation jobs (for debugging/admin purposes).
        
        Returns:
            Dictionary of all jobs
        """
        return self.jobs.copy()
    
    def get_available_models(self) -> list[str]:
        """
        Get list of available models.
        
        Returns:
            List of available model names
        """
        return self.available_models.copy()


# Global generation service instance
generation_service = GenerationService()
