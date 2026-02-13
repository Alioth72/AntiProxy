"""
Storage routes for handling file uploads to Azure Blob Storage.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import Annotated
from pydantic import BaseModel

from app.auth.dependencies import get_current_user, UserContext
from app.models.user import User, UserRole
from app.services.azure_storage import azure_storage
from app.db import get_db
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import UUID
from app.models.student import Student
from app.models.class_model import Class


router = APIRouter(prefix="/api/storage", tags=["storage"])


class UploadResponse(BaseModel):
    """Response for successful file upload."""
    url: str
    blob_name: str
    message: str


class SasUrlRequest(BaseModel):
    """Request for generating SAS URL."""
    container_name: str
    blob_name: str
    expiry_hours: int = 1


class SasUrlResponse(BaseModel):
    """Response with SAS URL."""
    sas_url: str
    expires_in_hours: int


# Student photo upload (accessible by admins and the student's teachers)
@router.post("/students/{roll_no}/photo", response_model=UploadResponse)
async def upload_student_photo(
    roll_no: str,
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[UserContext, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Upload or update a student's profile photo.
    
    Accessible by:
    - Admins (can upload for any student)
    - Teachers (can upload for students in their classes)
    """
    # Verify student exists
    student = db.query(Student).filter(Student.roll_no == roll_no).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Permission check
    if current_user.role != UserRole.ADMIN:
        # Check if teacher has this student in any of their classes
        from app.models.class_model import ClassStudent
        
        has_access = db.query(ClassStudent).join(Class).filter(
            Class.teacher_id == current_user.user_id,
            ClassStudent.student_id == student.id
        ).first() is not None
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only upload photos for students in your classes"
            )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    file_data = await file.read()
    if len(file_data) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )
    
    # Upload to Azure
    try:
        from io import BytesIO
        url = azure_storage.upload_student_photo(
            roll_no=roll_no,
            file_data=BytesIO(file_data),
            filename=file.filename,
            content_type=file.content_type
        )
        
        # Update student photo URL in database
        student.photo_url = url
        db.commit()
        
        return UploadResponse(
            url=url,
            blob_name=url.split('/')[-1],
            message="Student photo uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


# Assignment upload (teachers only)
@router.post("/classes/{class_id}/assignments", response_model=UploadResponse)
async def upload_assignment(
    class_id: str,
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[UserContext, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Upload an assignment file for a class.
    
    Only accessible by:
    - The teacher who owns the class
    - Admins
    """
    # Verify class exists
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Permission check
    if current_user.role != UserRole.ADMIN and str(class_obj.teacher_id) != str(current_user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload assignments for your own classes"
        )
    
    # Validate file type (allow common document types)
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT"
        )
    
    # Validate file size (max 20MB)
    max_size = 20 * 1024 * 1024  # 20MB
    file_data = await file.read()
    if len(file_data) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 20MB"
        )
    
    # Upload to Azure
    try:
        from io import BytesIO
        url = azure_storage.upload_assignment(
            class_id=class_id,
            teacher_id=str(current_user.user_id),
            file_data=BytesIO(file_data),
            filename=file.filename,
            content_type=file.content_type
        )
        
        return UploadResponse(
            url=url,
            blob_name=url.split('/')[-1],
            message="Assignment uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


# Attendance image upload (teachers only, automatically called during attendance)
@router.post("/attendance/{session_id}/image", response_model=UploadResponse)
async def upload_attendance_image(
    session_id: str,
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[UserContext, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Upload an attendance session image.
    
    Only accessible by:
    - The teacher who created the session
    - Admins
    """
    from app.models.attendance import AttendanceSession
    
    # Verify session exists
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance session not found"
        )
    
    # Permission check
    if current_user.role != UserRole.ADMIN and str(session.teacher_id) != str(current_user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload images for your own attendance sessions"
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_data = await file.read()
    if len(file_data) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB"
        )
    
    # Upload to Azure
    try:
        from io import BytesIO
        url = azure_storage.upload_attendance_image(
            session_id=session_id,
            teacher_id=str(current_user.user_id),
            file_data=BytesIO(file_data),
            filename=file.filename,
            content_type=file.content_type
        )
        
        # Update session with processed image URL
        session.processed_image_url = url
        db.commit()
        
        return UploadResponse(
            url=url,
            blob_name=url.split('/')[-1],
            message="Attendance image uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


# Generate temporary SAS URL for secure access
@router.post("/sas-url", response_model=SasUrlResponse)
async def generate_sas_url(
    request: SasUrlRequest,
    current_user: Annotated[UserContext, Depends(get_current_user)]
):
    """
    Generate a temporary SAS URL for accessing a blob.
    
    This allows secure, time-limited access to files.
    Only authenticated users can generate SAS URLs.
    """
    try:
        sas_url = azure_storage.generate_sas_url(
            container_name=request.container_name,
            blob_name=request.blob_name,
            expiry_hours=request.expiry_hours
        )
        
        return SasUrlResponse(
            sas_url=sas_url,
            expires_in_hours=request.expiry_hours
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate SAS URL: {str(e)}"
        )


# List assignments for a class
@router.get("/classes/{class_id}/assignments")
async def list_class_assignments(
    class_id: str,
    current_user: Annotated[UserContext, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    List all assignment files for a class.
    
    Accessible by:
    - The teacher who owns the class
    - Admins
    """
    # Verify class exists
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Permission check
    if current_user.role != UserRole.ADMIN and str(class_obj.teacher_id) != str(current_user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view assignments for your own classes"
        )
    
    try:
        prefix = f"classes/{class_id}/assignments"
        blobs = azure_storage.list_blobs(
            container_name=azure_storage.CONTAINER_ASSIGNMENTS,
            prefix=prefix
        )
        
        assignments = []
        for blob in blobs:
            assignments.append({
                "name": blob.name.split('/')[-1],
                "url": f"https://{azure_storage.blob_service_client.account_name}.blob.core.windows.net/{azure_storage.CONTAINER_ASSIGNMENTS}/{blob.name}",
                "size": blob.size,
                "created": blob.creation_time.isoformat() if blob.creation_time else None,
                "metadata": blob.metadata
            })
        
        return {
            "class_id": class_id,
            "assignments": assignments,
            "count": len(assignments)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list assignments: {str(e)}"
        )
