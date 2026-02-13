"""
Authentication routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db import get_db
from app.schemas.auth import GoogleLoginRequest, TokenResponse, UserInfo
from app.auth.google_verify import verify_google_token, GoogleAuthError
from app.auth.jwt import create_jwt
from app.models.user import User, AllowedEmail, UserRole
from app.models.student import Student

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user via Google OAuth and return JWT token.
    
    Flow:
    1. Verify Google ID token
    2. Check if email is whitelisted
    3. Upsert user in database
    4. Generate internal JWT
    5. Return JWT and user info
    """
    # Verify Google token
    try:
        google_info = await verify_google_token(request.id_token)
    except GoogleAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    
    email = google_info['email']
    name = google_info.get('name', email.split('@')[0])
    
    # Check if email is in allowed list
    allowed = db.query(AllowedEmail).filter(AllowedEmail.email == email).first()
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not authorized to access this system. Please contact an administrator."
        )
    
    # Get or create user
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update last login
        user.last_login_at = datetime.utcnow()
        user.name = name  # Update name in case it changed
    else:
        # Create new user with role from allowed_emails
        user = User(
            email=email,
            name=name,
            role=allowed.role,
            last_login_at=datetime.utcnow()
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)
    
    # Generate JWT
    token = create_jwt(user.id, user.email, user.role.value)
    
    # Prepare response
    user_info = UserInfo(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value
    )
    
    return TokenResponse(token=token, user=user_info)


@router.post("/google/student", response_model=TokenResponse)
async def google_login_student(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate student via Google OAuth and return JWT token.
    
    Flow:
    1. Verify Google ID token
    2. Check if email belongs to a registered student
    3. Create/update user record with student role
    4. Generate internal JWT
    5. Return JWT and user info
    """
    # Verify Google token
    try:
        google_info = await verify_google_token(request.id_token)
    except GoogleAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    
    email = google_info['email']
    name = google_info.get('name', email.split('@')[0])
    
    # Check if email belongs to a student in the database
    student = db.query(Student).filter(
        (Student.email == email) | (Student.dtu_email == email)
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not registered as a student. Please contact an administrator."
        )
    
    # Get or create user record with student role
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update existing user
        user.last_login_at = datetime.utcnow()
        user.name = name
        user.role = UserRole.STUDENT  # Ensure role is student
    else:
        # Create new student user
        user = User(
            email=email,
            name=name,
            role=UserRole.STUDENT,
            last_login_at=datetime.utcnow()
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)
    
    # Generate JWT with student role
    token = create_jwt(user.id, user.email, user.role.value)
    
    # Prepare response with student ID included
    user_info = UserInfo(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,
        studentId=str(student.id)  # Include student ID for frontend
    )
    
    return TokenResponse(token=token, user=user_info)
