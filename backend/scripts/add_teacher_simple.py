#!/usr/bin/env python3
"""
Simple script to add a teacher email directly to database.
Usage: python add_teacher_simple.py
"""
import psycopg2
from datetime import datetime

# Direct database connection
DB_CONFIG = {
    'host': '34.180.39.58',
    'port': 5432,
    'database': 'dtu_aims_attendance',
    'user': 'dtu_aims_user',
    'password': 'dtuAims2026User!'
}

def add_teacher_email(email: str):
    """Add a teacher email to the allowed_emails table."""
    
    conn = None
    try:
        # Connect to database
        print("Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Check if email exists
        cur.execute("SELECT email, role FROM allowed_emails WHERE email = %s", (email,))
        existing = cur.fetchone()
        
        if existing:
            print(f"⚠️  Email {existing[0]} already exists with role: {existing[1]}")
            return False
        
        # Insert new teacher
        cur.execute("""
            INSERT INTO allowed_emails (email, role, created_at) 
            VALUES (%s, %s, %s)
        """, (email, 'TEACHER', datetime.utcnow()))
        
        conn.commit()
        print(f"✅ Successfully added {email} as TEACHER")
        
        # Show all emails
        cur.execute("SELECT email, role, created_at FROM allowed_emails ORDER BY created_at DESC")
        emails = cur.fetchall()
        
        print("\n📋 Current Allowed Emails:")
        print("-" * 70)
        print(f"{'Email':<40} {'Role':<15} {'Created'}")
        print("-" * 70)
        
        for em, role, created in emails:
            created_str = created.strftime("%Y-%m-%d %H:%M") if created else "N/A"
            print(f"{em:<40} {role:<15} {created_str}")
        
        print("-" * 70)
        print(f"Total: {len(emails)} emails\n")
        
        cur.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if conn:
            conn.close()


def main():
    """Main function."""
    print("=" * 70)
    print("  DTU AIMS - Add Teacher Email (Simple)")
    print("=" * 70)
    print()
    
    # Get email from user
    email = input("Enter teacher email address: ").strip()
    
    if not email:
        print("❌ Email cannot be empty")
        return
    
    # Basic validation
    if '@' not in email or '.' not in email:
        print("❌ Invalid email format")
        return
    
    # Confirm
    confirm = input(f"\nAdd '{email}' as TEACHER? (y/n): ").strip().lower()
    
    if confirm != 'y':
        print("❌ Cancelled")
        return
    
    print()
    add_teacher_email(email)


if __name__ == "__main__":
    main()
