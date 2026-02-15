"""
Seed script to populate allowed_emails table with initial faculty/admin emails.
"""
import sys
import os
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.models.user import AllowedEmail, UserRole


def seed_allowed_emails():
    """
    Populate the allowed_emails table with initial faculty/admin emails.
    
    Modify this list to include your actual faculty emails.
    """
    db: Session = SessionLocal()
    
    try:
        # Authorized teacher emails for DTU AIMS system
        allowed_emails = [
            {
                "email": "vivaanjaindps@gmail.com",
                "name": "Vivaan Jain",
                "role": UserRole.TEACHER
            },
            {
                "email": "shubhankgupta165@gmail.com",
                "name": "Shubhank Gupta",
                "role": UserRole.TEACHER
            },
            {
                "email": "rudranshsinghrathore15@gmail.com",
                "name": "Rudransh Singh Rathore",
                "role": UserRole.TEACHER
            },
            {
                "email": "jeeprep165@gmail.com",
                "name": "Teacher 4",
                "role": UserRole.TEACHER
            },
            {
                "email": "007aryansood@gmail.com",
                "name": "Aryan Sood",
                "role": UserRole.TEACHER
            },
            {
                "email": "aarushi28alpha@gmail.com",
                "name": "Aarushi",
                "role": UserRole.TEACHER
            },
            {
                "email": "aliothmerak123@gmail.com",
                "name": "Teacher 7",
                "role": UserRole.TEACHER
            }
        ]
        
        for email_data in allowed_emails:
            # Check if email already exists
            existing = db.query(AllowedEmail).filter(
                AllowedEmail.email == email_data["email"]
            ).first()
            
            if existing:
                print(f"Email {email_data['email']} already exists, skipping...")
                continue
            
            # Create new allowed email
            allowed_email = AllowedEmail(
                email=email_data["email"],
                name=email_data["name"],
                role=email_data["role"]
            )
            db.add(allowed_email)
            print(f"Added {email_data['email']} ({email_data['role'].value})")
        
        db.commit()
        print("\n✅ Successfully seeded allowed_emails table")
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        raise
        
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding allowed_emails table...\n")
    seed_allowed_emails()
