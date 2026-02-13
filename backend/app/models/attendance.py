"""
Attendance session and status models.
"""
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Date, Boolean, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum as SQLEnum
import uuid

from app.db import Base


class AttendanceStatus(str, enum.Enum):
    """Attendance status enumeration."""
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class AttendanceSession(Base):
    """
    One attendance-taking event for a class on a specific date.
    e.g., "IT307-D attendance on 2025-10-08"
    """
    __tablename__ = "attendance_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    session_date = Column(Date, nullable=False)
    processed_image_url = Column(Text)  # proof image / processed face sheet
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Prevent duplicate sessions for same class on same date
    __table_args__ = (
        UniqueConstraint('class_id', 'session_date', name='uq_session_class_date'),
    )
    
    # Relationships
    class_obj = relationship("Class", back_populates="attendance_sessions")
    teacher = relationship("User", back_populates="attendance_sessions")
    statuses = relationship("AttendanceStatusRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceStatusRecord(Base):
    """
    Per-student attendance record for a specific session.
    This replaces the Firestore "studentStatuses" map.
    """
    __tablename__ = "attendance_statuses"
    
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), primary_key=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True)
    status = Column(SQLEnum(AttendanceStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=AttendanceStatus.ABSENT)
    recognized_by_ai = Column(Boolean, nullable=False, default=False)
    similarity_score = Column(Numeric(5, 2))  # AI confidence percentage or similarity
    
    # Relationships
    session = relationship("AttendanceSession", back_populates="statuses")
    student = relationship("Student", back_populates="attendance_statuses")
