from typing import Dict
from fastapi import APIRouter, HTTPException, status

from app.models.generation import GenerationRequest, GenerationResponse, GenerationJob
from app.services.generation_service import generation_service


router = APIRouter()


@router.post("/generate", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
async def create_generation_job(request: GenerationRequest):
    """
    Create a new image generation job.
    
    This endpoint accepts a text prompt and triggers N real image generation requests 
    to Replicate using the black-forest-labs/flux-schnell model. Each request generates 
    one image, so requesting 10 images will create 10 separate Replicate predictions.
    
    **Request Body:**
    - **prompt**: Text description for image generation (1-1000 characters)
    - **num_images**: Number of images to generate (5-20)
    - **model**: Optional AI model to use (defaults to black-forest-labs/flux-schnell)
    
    **Available Models:**
    - black-forest-labs/flux-schnell (default)
    
    Args:
        request: Generation request containing prompt, num_images, and optional model
        
    Returns:
        GenerationResponse with unique job_id
        
    Raises:
        HTTPException: 400 if request validation fails or model is unsupported
        HTTPException: 500 if job creation fails
    """
    try:
        result = await generation_service.create_generation_job(request)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create generation job"
        )


@router.get("/generate/{job_id}", response_model=GenerationJob)
async def get_generation_job(job_id: str):
    """
    Get the status and details of a generation job.
    
    Args:
        job_id: The unique job identifier
        
    Returns:
        GenerationJob with current status and details
        
    Raises:
        HTTPException: 404 if job not found
    """
    job = generation_service.get_job_status(job_id)
    
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generation job with ID '{job_id}' not found"
        )
    
    return job


@router.get("/generate", response_model=Dict[str, GenerationJob])
async def list_generation_jobs():
    """
    List all generation jobs (for debugging/admin purposes).
    
    Returns:
        Dictionary of all generation jobs
    """
    return generation_service.get_all_jobs()


@router.get("/models")
async def get_available_models():
    """
    Get list of available AI models for image generation.
    
    Returns:
        List of available model names with descriptions
    """
    models = generation_service.get_available_models()
    return {
        "models": models,
        "default": generation_service.default_model,
        "description": {
            "black-forest-labs/flux-schnell": "Black Forest Labs' FLUX Schnell model - fast, high-quality image generation with excellent prompt adherence"
        }
    }
