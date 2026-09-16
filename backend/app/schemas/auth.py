from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    class_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    institution_id: Optional[str] = None
    class_name: Optional[str] = None
    created_at: datetime

class TeacherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    institution_id: Optional[str] = None
    created_at: datetime

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: UserRole
    created_at: datetime
    student_profile: Optional[StudentOut] = None
    teacher_profile: Optional[TeacherOut] = None
