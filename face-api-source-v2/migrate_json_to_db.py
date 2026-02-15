#!/usr/bin/env python3
"""
Migration Script: JSON to PostgreSQL
Migrates face embeddings from JSON file to PostgreSQL database.

Usage:
    python migrate_json_to_db.py [--json-file reference_database.json] [--dry-run]

Environment Variables Required:
    - DATABASE_URL or FACE_DB_URL
    - Or: CLOUD_SQL_CONNECTION_NAME, DB_USER, DB_PASS, DB_NAME
"""
import os
import sys
import json
import argparse
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import db_manager, FaceEmbedding, init_database, get_db_session


def load_json_database(json_path: str) -> dict:
    """Load the JSON reference database."""
    print(f"📖 Loading JSON file: {json_path}")
    
    if not os.path.exists(json_path):
        print(f"❌ JSON file not found: {json_path}")
        return None
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    people = data.get('people', {})
    print(f"✅ Found {len(people)} people in JSON file")
    
    return data


def migrate_to_database(json_data: dict, dry_run: bool = False) -> dict:
    """
    Migrate JSON data to PostgreSQL database.
    
    Args:
        json_data: Loaded JSON data
        dry_run: If True, don't actually write to database
        
    Returns:
        Migration statistics
    """
    stats = {
        'total': 0,
        'migrated': 0,
        'skipped': 0,
        'errors': 0,
        'error_details': []
    }
    
    if not db_manager.is_available():
        print("❌ Database is not available. Check your connection settings.")
        return stats
    
    # Initialize database tables
    if not dry_run:
        print("🔧 Creating database tables...")
        init_database()
    
    people = json_data.get('people', {})
    stats['total'] = len(people)
    
    session = get_db_session()
    if session is None:
        print("❌ Could not get database session")
        return stats
    
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Starting migration...")
    print("-" * 50)
    
    for person_name, person_data in people.items():
        try:
            embedding = person_data.get('embedding', [])
            
            if not embedding or len(embedding) == 0:
                print(f"⚠️  Skipping {person_name}: No embedding data")
                stats['skipped'] += 1
                continue
            
            # Check if person already exists
            existing = session.query(FaceEmbedding).filter(
                FaceEmbedding.person_name == person_name
            ).first()
            
            if existing:
                print(f"⏭️  Skipping {person_name}: Already exists in database")
                stats['skipped'] += 1
                continue
            
            if dry_run:
                print(f"✓  Would migrate: {person_name} (embedding: {len(embedding)} dims)")
                stats['migrated'] += 1
                continue
            
            # Create new record
            record = FaceEmbedding(
                person_name=person_name,
                person_id=person_data.get('person_id') or person_data.get('id'),
                embedding=embedding,
                image_path=person_data.get('image_path'),
                created_at=datetime.utcnow(),
            )
            
            session.add(record)
            print(f"✅ Migrated: {person_name}")
            stats['migrated'] += 1
            
        except Exception as e:
            print(f"❌ Error migrating {person_name}: {e}")
            stats['errors'] += 1
            stats['error_details'].append({'name': person_name, 'error': str(e)})
    
    # Commit all changes
    if not dry_run:
        try:
            session.commit()
            print("\n✅ Migration committed to database")
        except Exception as e:
            session.rollback()
            print(f"\n❌ Failed to commit migration: {e}")
            stats['errors'] += stats['migrated']
            stats['migrated'] = 0
    
    session.close()
    return stats


def verify_migration(session) -> int:
    """Verify the migration by counting records in database."""
    try:
        count = session.query(FaceEmbedding).count()
        return count
    except Exception as e:
        print(f"❌ Error verifying migration: {e}")
        return -1


def main():
    parser = argparse.ArgumentParser(description='Migrate face embeddings from JSON to PostgreSQL')
    parser.add_argument(
        '--json-file',
        default='reference_database.json',
        help='Path to JSON reference database (default: reference_database.json)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be migrated without making changes'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Verify migration after completion'
    )
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("Face Embeddings Migration: JSON → PostgreSQL")
    print("=" * 50)
    
    # Check database connection
    if not db_manager.is_available():
        print("\n❌ Database connection not available.")
        print("\nPlease set one of the following:")
        print("  - DATABASE_URL or FACE_DB_URL")
        print("  - CLOUD_SQL_CONNECTION_NAME + DB_USER + DB_PASS + DB_NAME")
        print("  - DB_HOST + DB_USER + DB_PASS + DB_NAME")
        sys.exit(1)
    
    health = db_manager.health_check()
    print(f"\n📊 Database Status: {health['status']}")
    
    # Load JSON data
    json_data = load_json_database(args.json_file)
    if json_data is None:
        sys.exit(1)
    
    # Perform migration
    stats = migrate_to_database(json_data, dry_run=args.dry_run)
    
    # Print summary
    print("\n" + "=" * 50)
    print("Migration Summary")
    print("=" * 50)
    print(f"Total in JSON:    {stats['total']}")
    print(f"Migrated:         {stats['migrated']}")
    print(f"Skipped:          {stats['skipped']}")
    print(f"Errors:           {stats['errors']}")
    
    if stats['error_details']:
        print("\nError Details:")
        for error in stats['error_details']:
            print(f"  - {error['name']}: {error['error']}")
    
    # Verify if requested
    if args.verify and not args.dry_run:
        print("\n🔍 Verifying migration...")
        session = get_db_session()
        if session:
            count = verify_migration(session)
            session.close()
            print(f"   Records in database: {count}")
    
    print("\n✅ Migration complete!")


if __name__ == "__main__":
    main()
