"""fix_classes_table_columns

Revision ID: 002_fix_classes
Revises: 001_initial
Create Date: 2026-01-14

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_fix_classes'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # Drop dependent tables first
    op.execute('DROP TABLE IF EXISTS attendance_records CASCADE')
    op.execute('DROP TABLE IF EXISTS class_enrollments CASCADE')
    op.execute('DROP TABLE IF EXISTS attendance_sessions CASCADE')
    op.execute('DROP TABLE IF EXISTS classes CASCADE')
    
    # Recreate classes table with correct columns
    op.execute('''
        CREATE TABLE classes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            section TEXT NOT NULL,
            ltp_pattern TEXT,
            teacher_type TEXT,
            practical_group TEXT,
            teacher_id UUID NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_teacher_class_section UNIQUE (teacher_id, code, section)
        )
    ''')
    
    # Recreate attendance_sessions
    op.execute('''
        CREATE TABLE attendance_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            teacher_id UUID NOT NULL REFERENCES users(id),
            session_date DATE NOT NULL,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE,
            room_code TEXT,
            qr_secret TEXT,
            face_recognition_enabled BOOLEAN DEFAULT FALSE,
            bluetooth_enabled BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    ''')
    
    op.execute('CREATE INDEX ix_attendance_sessions_class_id ON attendance_sessions(class_id)')
    op.execute('CREATE INDEX ix_attendance_sessions_teacher_id ON attendance_sessions(teacher_id)')
    op.execute('CREATE INDEX ix_attendance_sessions_room_code ON attendance_sessions(room_code)')
    
    # Recreate class_enrollments
    op.execute('''
        CREATE TABLE class_enrollments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(class_id, student_id)
        )
    ''')
    
    op.execute('CREATE INDEX ix_class_enrollments_class_id ON class_enrollments(class_id)')
    op.execute('CREATE INDEX ix_class_enrollments_student_id ON class_enrollments(student_id)')
    
    # Recreate attendance_records
    op.execute('''
        CREATE TABLE attendance_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            status attendancestatus NOT NULL DEFAULT 'absent',
            marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            face_verified BOOLEAN DEFAULT FALSE,
            bluetooth_verified BOOLEAN DEFAULT FALSE,
            qr_verified BOOLEAN DEFAULT FALSE,
            notes TEXT,
            UNIQUE(session_id, student_id)
        )
    ''')
    
    op.execute('CREATE INDEX ix_attendance_records_session_id ON attendance_records(session_id)')
    op.execute('CREATE INDEX ix_attendance_records_student_id ON attendance_records(student_id)')


def downgrade():
    # Not implementing downgrade as this is a fix
    pass
