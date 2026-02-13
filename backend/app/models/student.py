"""
Student model.
"""
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db import Base


class Student(Base):
    """
    Students whose attendance is tracked.
    Students are not app users unless explicitly added to users table.
    """
    __tablename__ = "students"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roll_no = Column(Text, unique=True, nullable=False, index=True)
    name = Column(Text, nullable=False)
    photo_url = Column(Text)
    program = Column(Text)
    sp_code = Column(Text)
    semester = Column(Text)
    status = Column(Text)
    duration = Column(Text)
    email = Column(Text)
    dtu_email = Column(Text)
    phone = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    class_enrollments = relationship("ClassStudent", back_populates="student")
    attendance_statuses = relationship("AttendanceStatusRecord", back_populates="student")
