from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import engine, SessionLocal
from app.database.base import Base
# Import all models to ensure they are registered with Base
import app.models  # noqa
from app.database.seed_curriculum import seed_sample_curriculum

from sqlalchemy import inspect, text

def ensure_schema_up_to_date(bind_engine):
    """Ensures existing SQLite tables receive newly added columns when upgrading schema."""
    try:
        inspector = inspect(bind_engine)
        table_names = inspector.get_table_names()
        migrations = [
            ("students", "class_id", "VARCHAR"),
            ("subjects", "class_id", "VARCHAR"),
            ("subjects", "class_name", "VARCHAR(100)"),
            ("ask_teacher_questions", "chapter_id", "VARCHAR"),
            ("ask_teacher_questions", "module_id", "VARCHAR"),
            ("ask_teacher_questions", "selected_text", "TEXT"),
        ]
        with bind_engine.begin() as conn:
            for table_name, col_name, col_type in migrations:
                if table_name in table_names:
                    existing_cols = [c['name'] for c in inspector.get_columns(table_name)]
                    if col_name not in existing_cols:
                        print(f"[Auto-Migration] Adding missing column '{col_name}' to table '{table_name}'")
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
    except Exception as e:
        print(f"[Auto-Migration Warning]: {e}")

# Create tables if not using Alembic CLI directly
Base.metadata.create_all(bind=engine)
ensure_schema_up_to_date(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure schema & sample curriculum data exist
    ensure_schema_up_to_date(engine)
    db = SessionLocal()
    try:
        seed_sample_curriculum(db)
    except Exception as e:
        print(f"[Startup Seeding Warning]: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="MindForge API",
    description="MindForge — AI-Powered Personalized Adaptive Education Platform & RAG Teacher System",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.api import (
    auth,
    subjects,
    chapters,
    modules,
    notes,
    ask_teacher,
    documents,
    profile,
    diagnostic,
    learning_path,
    adaptive_content,
    flashcards,
    revision,
    quizzes,
    rag,
    knowledge_graph,
    recommendations,
    teacher_analytics,
    classes,
    attendance,
    study_workspace
)

# Existing Phase 1 & 2 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(subjects.router, prefix=settings.API_V1_STR)
app.include_router(chapters.router, prefix=settings.API_V1_STR)
app.include_router(modules.router, prefix=settings.API_V1_STR)
app.include_router(notes.router, prefix=settings.API_V1_STR)
app.include_router(ask_teacher.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)

# Phase 3 & 4 Learning Engine & RAG Routers
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(diagnostic.router, prefix=settings.API_V1_STR)
app.include_router(learning_path.router, prefix=settings.API_V1_STR)
app.include_router(adaptive_content.router, prefix=settings.API_V1_STR)
app.include_router(flashcards.router, prefix=settings.API_V1_STR)
app.include_router(revision.router, prefix=settings.API_V1_STR)
app.include_router(quizzes.router, prefix=settings.API_V1_STR)
app.include_router(rag.router, prefix=settings.API_V1_STR)
app.include_router(knowledge_graph.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(teacher_analytics.router, prefix=settings.API_V1_STR)

# Phase 7 School Class, Attendance & Study Workspace Routers
app.include_router(classes.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(study_workspace.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to MindForge API",
        "docs": "/docs",
        "version": "2.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MindForge Engine"}
