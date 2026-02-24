#!/usr/bin/env python3
"""
Script to add a teacher email to the allowed_emails table.
Usage: python add_teacher.py
"""
import sys
import os
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import AllowedEmail, UserRole
from app.config import settings


def add_teacher_email(email: str):
    """Add a teacher email to the allowed_emails table."""
    
    # Create database connection
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if email already exists
        existing = db.query(AllowedEmail).filter(AllowedEmail.email == email).first()
        
        if existing:
            print(f"⚠️  Email {email} already exists with role: {existing.role.value}")
            return False
        
        # Add new teacher email
        new_teacher = AllowedEmail(
            email=email,
            role=UserRole.TEACHER,
            created_at=datetime.utcnow()
        )
        
        db.add(new_teacher)
        db.commit()
        
        print(f"✅ Successfully added {email} as TEACHER")
        return True
        
    except Exception as e:
        print(f"❌ Error adding teacher email: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()


def list_allowed_emails():
    """List all allowed emails."""
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        emails = db.query(AllowedEmail).order_by(AllowedEmail.created_at.desc()).all()
        
        print("\n📋 Current Allowed Emails:")
        print("-" * 70)
        print(f"{'Email':<40} {'Role':<15} {'Created'}")
        print("-" * 70)
        
        for email in emails:
            created = email.created_at.strftime("%Y-%m-%d %H:%M") if email.created_at else "N/A"
            print(f"{email.email:<40} {email.role.value:<15} {created}")
        
        print("-" * 70)
        print(f"Total: {len(emails)} emails")
        
    except Exception as e:
        print(f"❌ Error listing emails: {e}")
        
    finally:
        db.close()


def main():
    """Main function."""
    print("=" * 70)
    print("  DTU AIMS - Add Teacher Email")
    print("=" * 70)
    print()
    
    # Get email from user
    email = input("Enter teacher email address: ").strip()
    
    if not email:
        print("❌ Email cannot be empty")
        sys.exit(1)
    
    # Basic email validation
    if '@' not in email or '.' not in email:
        print("❌ Invalid email format")
        sys.exit(1)
    
    # Confirm
    confirm = input(f"\nAdd '{email}' as TEACHER? (y/n): ").strip().lower()
    
    if confirm != 'y':
        print("❌ Cancelled")
        sys.exit(0)
    
    # Add the email
    success = add_teacher_email(email)
    
    if success:
        # Show updated list
        list_allowed_emails()
    
    print()


if __name__ == "__main__":
    main()
