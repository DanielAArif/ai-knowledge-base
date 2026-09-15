import os

from celery import Celery


REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://redis:6379/0"
)


celery_app = Celery(
    "kb_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)


celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    timezone="Asia/Jakarta",
    enable_utc=False,

    task_track_started=True,

    worker_prefetch_multiplier=1,

    task_acks_late=True,
    
    imports=("app.worker.tasks",),
)