"""
Database models and connection for Face Recognition API.
Stores face embeddings in PostgreSQL for persistent, dynamic enrollment.
"""
import os
import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Text, DateTime, Float, LargeBinary, Index, text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()


class FaceEmbedding(Base):
    """
    Stores face embeddings for enrolled students.
    Each record represents one person with their face embedding vector.
    """
    __tablename__ = "face_embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    person_name = Column(String(255), nullable=False, unique=True, index=True)
    person_id = Column(String(100), nullable=True, index=True)  # Optional external ID (e.g., roll number)
    embedding = Column(ARRAY(Float), nullable=False)  # 512-dim float array
    image_path = Column(Text, nullable=True)  # Optional: path to original image
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata
    embedding_model = Column(String(100), default="insightface_arcface")
    embedding_version = Column(String(50), default="1.0")
    
    __table_args__ = (
        Index('ix_face_embeddings_person_name_lower', 'person_name'),
    )
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': str(self.id),
            'person_name': self.person_name,
            'person_id': self.person_id,
            'embedding': self.embedding,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class DatabaseManager:
    """
    Manages database connections and provides session management.
    Supports both Cloud SQL (via Unix socket) and direct PostgreSQL connections.
    """
    
    _instance = None
    _engine = None
    _session_factory = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._engine is None:
            self._initialize_engine()
    
    def _initialize_engine(self):
        """Initialize the database engine based on environment configuration."""
        database_url = self._get_database_url()
        
        if database_url:
            try:
                self._engine = create_engine(
                    database_url,
                    poolclass=QueuePool,
                    pool_size=5,
                    max_overflow=10,
                    pool_pre_ping=True,
                    pool_recycle=300,
                )
                self._session_factory = scoped_session(
                    sessionmaker(bind=self._engine, autocommit=False, autoflush=False)
                )
                logger.info("✅ Database engine initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize database engine: {e}")
                self._engine = None
                self._session_factory = None
        else:
            logger.warning("⚠️ No database URL configured, running in JSON-only mode")
    
    def _get_database_url(self) -> str:
        """
        Get database URL from environment.
        Supports both direct connection and Cloud SQL socket connection.
        """
        # First check for explicit DATABASE_URL
        database_url = os.environ.get('FACE_DB_URL') or os.environ.get('DATABASE_URL')
        
        if database_url:
            return database_url
        
        # Check for Cloud SQL configuration
        cloud_sql_instance = os.environ.get('CLOUD_SQL_CONNECTION_NAME')
        db_user = os.environ.get('DB_USER', 'dtu_aims_user')
        db_pass = os.environ.get('DB_PASS', '')
        db_name = os.environ.get('DB_NAME', 'dtu_aims_attendance')
        
        if cloud_sql_instance:
            # Cloud SQL Unix socket connection
            socket_path = f"/cloudsql/{cloud_sql_instance}"
            return f"postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}?host={socket_path}"
        
        # Check for individual connection parameters
        db_host = os.environ.get('DB_HOST')
        db_port = os.environ.get('DB_PORT', '5432')
        
        if db_host:
            return f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        
        return None
    
    def get_session(self):
        """Get a new database session."""
        if self._session_factory is None:
            return None
        return self._session_factory()
    
    def close_session(self, session):
        """Close a database session."""
        if session:
            session.close()
    
    def create_tables(self):
        """Create all database tables if they don't exist."""
        if self._engine:
            try:
                Base.metadata.create_all(self._engine)
                logger.info("✅ Database tables created/verified")
                return True
            except Exception as e:
                logger.error(f"❌ Failed to create tables: {e}")
                # Mark database as unavailable so we fall back to JSON
                self._engine = None
                self._session_factory = None
                return False
        return False
    
    def is_available(self) -> bool:
        """Check if database is available."""
        return self._engine is not None
    
    def health_check(self) -> dict:
        """Perform a health check on the database connection."""
        if not self.is_available():
            return {'status': 'unavailable', 'message': 'Database not configured'}
        
        try:
            session = self.get_session()
            session.execute(text("SELECT 1"))
            session.close()
            return {'status': 'healthy', 'message': 'Database connection successful'}
        except Exception as e:
            return {'status': 'unhealthy', 'message': str(e)}


# Global database manager instance
db_manager = DatabaseManager()


def init_database():
    """Initialize database and create tables. Returns True if successful, False otherwise."""
    if db_manager.is_available():
        if db_manager.create_tables():
            return True
        else:
            logger.warning("⚠️ Database connection failed, will use JSON fallback")
            return False
    return False


def get_db_session():
    """Get a database session (convenience function)."""
    return db_manager.get_session()
