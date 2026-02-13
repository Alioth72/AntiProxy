"""
User and AllowedEmail models.
"""
import enum
from sqlalchemy import Column, String, Enum as SQLEnum, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    TEACHER = "teacher"
    ADMIN = "admin"
    STUDENT = "student"


class AllowedEmail(Base):
    """
    Whitelist of emails allowed to access the system.
    Only users with emails in this table can log in.
    """
    __tablename__ = "allowed_emails"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False, index=True)
    name = Column(Text)
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.TEACHER)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class User(Base):
    """
    System users (teachers and admins) who operate the attendance system.
    Not for students - students are tracked separately.
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False, index=True)
    name = Column(Text, nullable=False)
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.TEACHER)
    department = Column(Text)
    employee_id = Column(Text)
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    classes = relationship("Class", back_populates="teacher")
    attendance_sessions = relationship("AttendanceSession", back_populates="teacher")
