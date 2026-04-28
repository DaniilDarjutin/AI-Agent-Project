from typing import Sequence
from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session
from app.core.database import get_session
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskHistoryRead, TaskRead, TaskUpdate
from app.services.task_service import TaskService


router = APIRouter(prefix="/tasks", tags=["Tasks"])

task_repository = TaskRepository()
task_service = TaskService(task_repository)


@router.get("/", response_model=Sequence[TaskRead])
def get_tasks(session: Session = Depends(get_session)):
    return task_service.get_all_tasks(session)


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, session: Session = Depends(get_session)):
    return task_service.get_task_by_id(session, task_id)


@router.get("/{task_id}/history", response_model=Sequence[TaskHistoryRead])
def get_task_history(task_id: int, session: Session = Depends(get_session)):
    return task_service.get_task_history(session, task_id)


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate, session: Session = Depends(get_session)):
    return task_service.create_task(session, task_data)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    session: Session = Depends(get_session)
):
    return task_service.update_task(session, task_id, task_data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task_service.delete_task(session, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
