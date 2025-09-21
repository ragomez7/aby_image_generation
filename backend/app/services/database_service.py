import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from fastapi import HTTPException, status

from app.db.base import AsyncSessionFactory
from app.db.models import JobPredictionId
from app.models.generation import ReplicatePrediction


class DatabaseService:
    """Service for handling database operations for jobs and predictions."""
    
    def __init__(self):
        pass
    
    async def save_job_predictions(self, job_id: str, predictions: List[ReplicatePrediction]) -> None:
        """
        Save job and its associated prediction IDs to the database.
        
        Args:
            job_id: The unique job identifier
            predictions: List of Replicate predictions
            
        Raises:
            HTTPException: If database operation fails
        """
        try:
            async with AsyncSessionFactory() as session:
                # Create JobPredictionId records for each prediction
                job_prediction_records = []
                
                for prediction in predictions:
                    job_prediction_record = JobPredictionId(
                        job_id=uuid.UUID(job_id),
                        prediction_id=prediction.prediction_id  # Keep as string, not UUID
                    )
                    job_prediction_records.append(job_prediction_record)
                
                # Add all records to session
                session.add_all(job_prediction_records)
                
                # Commit the transaction
                await session.commit()
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save job predictions to database: {str(e)}"
            )
    
    async def get_prediction_ids_for_job(self, job_id: str) -> List[str]:
        """
        Get all prediction IDs associated with a job.
        
        Args:
            job_id: The unique job identifier
            
        Returns:
            List of prediction ID strings
            
        Raises:
            HTTPException: If database operation fails
        """
        try:
            async with AsyncSessionFactory() as session:
                # Query for all prediction IDs for this job
                result = await session.execute(
                    select(JobPredictionId.prediction_id)
                    .where(JobPredictionId.job_id == uuid.UUID(job_id))
                )
                
                prediction_ids = result.scalars().all()
                return list(prediction_ids)  # Already strings, no conversion needed
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve prediction IDs from database: {str(e)}"
            )
    
    async def check_job_exists(self, job_id: str) -> bool:
        """
        Check if a job exists in the database.
        
        Args:
            job_id: The unique job identifier
            
        Returns:
            True if job exists, False otherwise
            
        Raises:
            HTTPException: If database operation fails
        """
        try:
            async with AsyncSessionFactory() as session:
                result = await session.execute(
                    select(JobPredictionId.job_id)
                    .where(JobPredictionId.job_id == uuid.UUID(job_id))
                    .limit(1)
                )
                
                return result.scalar() is not None
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to check job existence in database: {str(e)}"
            )
    
    async def delete_job_predictions(self, job_id: str) -> None:
        """
        Delete all prediction records for a job.
        
        Args:
            job_id: The unique job identifier
            
        Raises:
            HTTPException: If database operation fails
        """
        try:
            async with AsyncSessionFactory() as session:
                # Delete all records for this job
                result = await session.execute(
                    select(JobPredictionId)
                    .where(JobPredictionId.job_id == uuid.UUID(job_id))
                )
                
                records_to_delete = result.scalars().all()
                
                for record in records_to_delete:
                    await session.delete(record)
                
                await session.commit()
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete job predictions from database: {str(e)}"
            )
    
    async def get_job_count(self) -> int:
        """
        Get total number of unique jobs in the database.
        
        Returns:
            Number of unique jobs
            
        Raises:
            HTTPException: If database operation fails
        """
        try:
            async with AsyncSessionFactory() as session:
                result = await session.execute(
                    select(JobPredictionId.job_id).distinct()
                )
                
                jobs = result.scalars().all()
                return len(jobs)
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get job count from database: {str(e)}"
            )


# Global database service instance
database_service = DatabaseService()
