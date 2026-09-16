# OnePath AI — Adaptive Education Platform (Phase 1 Foundation)

> **"One curriculum. Different paths to understanding. AI learns how you learn."**

OnePath AI is an AI-powered adaptive education platform for schools, universities, and institutions. **Phase 1** delivers a complete, production-ready full-stack foundation with real database persistence, JWT authentication, role-based portals for Students and Teachers, Subject/Chapter/Module curriculum management, a Digital Notebook, and an Ask Teacher doubt resolution system.

---

## Technical Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Glassmorphism design tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT interceptors

### Backend
- **Framework**: Python 3.11 + FastAPI
- **ORM & DB**: SQLAlchemy 2.0 + PostgreSQL / SQLite fallback
- **Migrations**: Alembic
- **Auth**: Passlib + Bcrypt + PyJWT
- **Testing**: Pytest + TestClient

---

## Project Structure

```
smart education system/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers (auth, subjects, chapters, modules, notes, ask_teacher)
│   │   ├── core/            # Config, Security (bcrypt/JWT), Dependencies
│   │   ├── database/        # SessionLocal & Engine factory
│   │   ├── models/          # SQLAlchemy ORM definitions
│   │   ├── schemas/         # Pydantic validation models
│   │   └── main.py          # FastAPI application entrypoint
│   ├── alembic/             # Alembic database migration scripts
│   ├── tests/               # Pytest suite for API endpoints & authorization
│   ├── alembic.ini          # Alembic configuration
│   ├── Dockerfile           # Backend container spec
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client & typed service endpoints
│   │   ├── components/      # Common, Layout (Navbar, Sidebar), Page shells
│   │   ├── context/         # AuthContext provider
│   │   ├── pages/
│   │   │   ├── auth/        # Login & Register pages
│   │   │   ├── student/     # Student Dashboard, Subjects, Notebook, Ask Teacher
│   │   │   └── teacher/     # Teacher Dashboard, Subject Mgmt, Chapter Mgmt, Doubts Inbox
│   │   ├── types/           # TypeScript domain models
│   │   ├── App.tsx          # React Router setup & Role Guards
│   │   └── index.css        # Glassmorphism & warm UI styles
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # PostgreSQL & Backend orchestration
└── README.md                # Documentation
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PROJECT_NAME="OnePath AI"
SECRET_KEY="onepath_ai_super_secret_key_change_in_production_2026_x99"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL="sqlite:///./onepath_ai.db"
# For PostgreSQL: DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/onepath_ai"
```

---

## Quick Start Guide

### Option 1: Run Locally (Fastest)

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`. Swagger API docs at `http://localhost:8000/docs`.

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:5173`.

---

### Option 2: Docker Compose

```bash
docker-compose up --build
```
This boots a PostgreSQL database container and the FastAPI backend.

---

## Running Backend Tests

Run the Pytest suite covering Auth, Role Authorization, Subject/Chapter/Module CRUD, Note isolation, and Ask Teacher workflows:

```bash
cd backend
python -m pytest tests/test_api.py
```

---

## Key Features Implemented in Phase 1

1. **Authentication & Authorization**:
   - Registration with role selection (`STUDENT` / `TEACHER`).
   - Secure Bcrypt password hashing & JWT token issuance.
   - Protected routes and role-based redirects (`/student/dashboard` vs `/teacher/dashboard`).

2. **Teacher Portal**:
   - **Subject Management**: Create, edit, and delete subjects with explicit deletion confirmation modals.
   - **Chapter & Module Management**: Structure curriculum levels and set ordering indices.
   - **Ask Teacher Inbox**: Real-time queue of questions submitted by students; teachers submit official responses.

3. **Student Portal**:
   - **Student Dashboard**: Personalized greeting with authenticated user name, enrolled subject cards, and recent digital notes summary.
   - **Subject & Module Explorer**: Browse teacher-approved curriculum structure with clean empty states for future learning content.
   - **Digital Notebook**: Create, edit, search, filter, and delete personal notes persisted to PostgreSQL.
   - **Ask Teacher Doubt Resolution**: Select subject/chapter/module, attach context text, submit questions, and view real-time teacher answers.

4. **Future Architecture Placeholders**:
   - Visual placeholders for AI Companion and Learning Insights with "Coming Soon" indicators ready for Phase 2/3 RAG, Knowledge Graph, and SuperMemo Spaced Repetition integration.
