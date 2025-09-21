import pytest
import asyncio
from httpx import AsyncClient
from app.main import app
from app.db.base import AsyncSessionFactory, Base, engine
from app.db.models import JobPredictionId
import uuid
import datetime

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session")
async def db_setup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="session")
async def client(db_setup):
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture(scope="function")
async def job_id(client): 
    # Create a dummy job_id and some prediction entries for testing
    test_job_id = str(uuid.uuid4())
    predictions_to_create = [
        JobPredictionId(job_id=uuid.UUID(test_job_id), prediction_id=f"pred_{i}") 
        for i in range(5)
    ]
    
    async with AsyncSessionFactory() as session:
        session.add_all(predictions_to_create)
        await session.commit()
    
    yield test_job_id
    
    # Clean up after test
    async with AsyncSessionFactory() as session:
        await session.execute(
            JobPredictionId.__table__.delete().where(JobPredictionId.job_id == uuid.UUID(test_job_id))
        )
        await session.commit()

@pytest.fixture(scope="session")
def base_url():
    return "http://localhost:8000"
