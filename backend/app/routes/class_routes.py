"""
Class management routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import time

from app.db import get_db
from app.auth.dependencies import get_current_user, require_teacher_or_admin, UserContext
from app.schemas.classes import UpdateStudentsRequest
from app.services.class_service import get_classes_for_user, update_class_students, create_class
from app.models.class_model import ClassSchedule

router = APIRouter(prefix="/classes", tags=["Classes"])


class CreateClassRequest(BaseModel):
    code: str
    name: str
    section: str
    ltp_pattern: Optional[str] = None
    teacher_type: Optional[str] = None
    practical_group: Optional[str] = None


class CreateScheduleRequest(BaseModel):
    day_of_week: int
    start_time: str  # HH:MM:SS format
    end_time: str  # HH:MM:SS format


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_class(
    request: CreateClassRequest,
    current_user: UserContext = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new class.
    """
    new_class = create_class(
        db=db,
        code=request.code,
        name=request.name,
        section=request.section,
        teacher_id=current_user.user_id,
        ltp_pattern=request.ltp_pattern,
        teacher_type=request.teacher_type,
        practical_group=request.practical_group
    )
    
    return {"id": str(new_class.id), "code": new_class.code, "name": new_class.name}


@router.post("/{class_id}/schedules", status_code=status.HTTP_201_CREATED)
async def add_class_schedule(
    class_id: UUID,
    request: CreateScheduleRequest,
    current_user: UserContext = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Add a schedule to a class.
    """
    from app.models.class_model import Class
    
    # Verify ownership
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if current_user.role != 'admin' and cls.teacher_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Parse time strings
    start_time = time.fromisoformat(request.start_time)
    end_time = time.fromisoformat(request.end_time)
    
    # Create schedule
    schedule = ClassSchedule(
        class_id=class_id,
        day_of_week=request.day_of_week,
        start_time=start_time,
        end_time=end_time
    )
    
    db.add(schedule)
    db.commit()
    
    return {"status": "success"}


@router.get("")
async def list_classes(
    current_user: UserContext = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    List all classes accessible to the current user.
    
    - Teachers see only their own classes
    - Admins see all classes
    """
    classes = get_classes_for_user(db, current_user.user_id, current_user.role)
    return classes


@router.put("/{class_id}/students")
async def update_students(
    class_id: UUID,
    request: UpdateStudentsRequest,
    current_user: UserContext = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Update the roster of students enrolled in a class.
    
    - Upserts students based on roll number
    - Adds students to the class if not already enrolled
    - Only class owner or admin can update
    """
    students = update_class_students(
        db,
        class_id,
        current_user.user_id,
        current_user.role,
        request.students
    )
    
    return {"students": students}


@router.post("/{class_id}/students/upload-csv")
async def upload_students_csv(
    class_id: UUID,
    file: UploadFile = File(...),
    current_user: UserContext = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Upload a CSV file containing student information to add to a class.
    
    CSV format:
    - Required columns: roll_no, name
    - Optional columns: email, dtu_email, phone, program, semester, sp_code, status, duration
    
    Students will be created/updated in the database and enrolled in the class.
    Students with email addresses can then login to the student app.
    """
    import csv
    import io
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )
    
    # Read and parse CSV
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        
        # Normalize column names (lowercase, replace spaces with underscores)
        def normalize_column(col):
            return col.lower().strip().replace(' ', '_').replace('-', '_')
        
        students_data = []
        row_number = 1
        errors = []
        
        for row in reader:
            row_number += 1
            # Normalize keys
            normalized_row = {normalize_column(k): v.strip() if v else None for k, v in row.items()}
            
            # Map common column name variations
            roll_no = (
                normalized_row.get('roll_no') or 
                normalized_row.get('rollno') or 
                normalized_row.get('roll_number') or 
                normalized_row.get('enrollment_no') or
                normalized_row.get('enrollment')
            )
            name = (
                normalized_row.get('name') or 
                normalized_row.get('student_name') or 
                normalized_row.get('full_name')
            )
            email = (
                normalized_row.get('email') or 
                normalized_row.get('personal_email') or
                normalized_row.get('student_email')
            )
            dtu_email = (
                normalized_row.get('dtu_email') or 
                normalized_row.get('dtuemail') or
                normalized_row.get('institutional_email') or
                normalized_row.get('college_email')
            )
            
            # Validate required fields
            if not roll_no:
                errors.append(f"Row {row_number}: Missing roll_no")
                continue
            if not name:
                errors.append(f"Row {row_number}: Missing name")
                continue
            
            from app.schemas.classes import StudentInput
            student_input = StudentInput(
                roll_no=roll_no,
                name=name,
                email=email,
                dtu_email=dtu_email,
                phone=normalized_row.get('phone') or normalized_row.get('mobile'),
                program=normalized_row.get('program') or normalized_row.get('course'),
                semester=normalized_row.get('semester') or normalized_row.get('sem'),
                sp_code=normalized_row.get('sp_code') or normalized_row.get('spcode'),
                status=normalized_row.get('status'),
                duration=normalized_row.get('duration')
            )
            students_data.append(student_input)
        
        if not students_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No valid students found in CSV. Errors: {errors}" if errors else "No students found in CSV"
            )
        
        # Use existing service to add students
        students = update_class_students(
            db,
            class_id,
            current_user.user_id,
            current_user.role,
            students_data
        )
        
        return {
            "message": f"Successfully processed {len(students_data)} students",
            "students_added": len(students_data),
            "errors": errors if errors else None,
            "students": students
        }
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not decode CSV file. Please ensure it is UTF-8 encoded."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV: {str(e)}"
        )
