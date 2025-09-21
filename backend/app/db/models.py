from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid


class JobPredictionId(Base):
    """SQLAlchemy model for jobs_prediction_ids table."""
    
    __tablename__ = "jobs_prediction_ids"
    
    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(String, primary_key=True)  # Replicate prediction IDs are text, not UUID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<JobPredictionId(job_id='{self.job_id}', prediction_id='{self.prediction_id}')>"
