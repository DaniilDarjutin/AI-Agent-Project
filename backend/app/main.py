from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import create_db_and_tables
from app import models
from app.api.routes.tasks import router as tasks_router
from app.api.routes.health import router as health_router
from app.api.routes.chat import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan
)

app.include_router(tasks_router)
app.include_router(health_router)
app.include_router(chat_router)

@app.get("/")
def root():
    return {"message": "AI Task Tracker Backend is running"}