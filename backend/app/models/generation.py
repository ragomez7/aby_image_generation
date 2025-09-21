from typing import Optional, List
from pydantic import BaseModel, Field, validator


class GenerationRequest(BaseModel):
    """Image generation request model."""
    prompt: str = Field(..., description="Text prompt for image generation", min_length=1, max_length=1000)
    num_images: int = Field(..., description="Number of images to generate", ge=5, le=20)
    model: Optional[str] = Field(None, description="Model to use for generation (optional)")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        """Validate prompt is not empty or just whitespace."""
        if not v or not v.strip():
            raise ValueError('Prompt cannot be empty or just whitespace')
        return v.strip()
    
    @validator('num_images')
    def validate_num_images(cls, v):
        """Validate num_images is within allowed range."""
        if v < 5 or v > 20:
            raise ValueError('Number of images must be between 5 and 20')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A beautiful sunset over the mountains",
                "num_images": 10,
                "model": "black-forest-labs/flux-schnell"
            }
        }


class GenerationResponse(BaseModel):
    """Image generation response model."""
    job_id: str = Field(..., description="Unique job identifier for the generation request")
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class ReplicatePrediction(BaseModel):
    """Model for tracking individual Replicate predictions."""
    prediction_id: str = Field(..., description="Replicate prediction ID")
    status: str = Field(..., description="Prediction status from Replicate")
    image_url: Optional[str] = Field(None, description="Generated image URL when completed")
    error: Optional[str] = Field(None, description="Error message if prediction failed")
    created_at: str = Field(..., description="When prediction was created")
    completed_at: Optional[str] = Field(None, description="When prediction completed")


class GenerationJob(BaseModel):
    """Internal model for tracking generation jobs."""
    job_id: str = Field(..., description="Unique job identifier")
    prompt: str = Field(..., description="Text prompt for image generation")
    num_images: int = Field(..., description="Number of images to generate")
    model: Optional[str] = Field(None, description="Model used for generation")
    status: str = Field(default="pending", description="Job status: pending, processing, completed, failed, partial")
    created_at: str = Field(..., description="ISO timestamp when job was created")
    completed_at: Optional[str] = Field(None, description="ISO timestamp when job completed")
    predictions: List[ReplicatePrediction] = Field(default_factory=list, description="Replicate predictions for this job")
    completed_images: int = Field(default=0, description="Number of completed images")
    failed_images: int = Field(default=0, description="Number of failed images")
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "prompt": "A beautiful sunset over the mountains",
                "num_images": 10,
                "model": "black-forest-labs/flux-schnell",
                "status": "processing",
                "created_at": "2024-01-15T10:30:00Z",
                "completed_at": None,
                "predictions": [
                    {
                        "prediction_id": "abc123-def456-ghi789",
                        "status": "succeeded",
                        "image_url": "https://replicate.delivery/mgz9j/output1.jpg",
                        "error": None,
                        "created_at": "2024-01-15T10:30:01Z",
                        "completed_at": "2024-01-15T10:30:15Z"
                    }
                ],
                "completed_images": 3,
                "failed_images": 0
            }
        }
