import os

class Config:
    """Configuration class for the Face Recognition API."""
    
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # File upload configuration
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or 'uploads'
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    
    # Face detection configuration (SCRFD - configured internally by InsightFace)
    # No external configuration needed - SCRFD uses optimal defaults
    
    # Face recognition configuration (InsightFace ArcFace)
    FACE_EMBEDDING_SIZE = int(os.environ.get('FACE_EMBEDDING_SIZE', 512))  # InsightFace outputs 512-dim embeddings
    SIMILARITY_THRESHOLD = float(os.environ.get('SIMILARITY_THRESHOLD', 1.0))  # Euclidean distance threshold
    FACE_DATABASE_PATH = os.environ.get('FACE_DATABASE_PATH') or 'face_database.pkl'
    
    # Server configuration
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 8080))
    
    # Logging configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    
    # Performance configuration
    CLEANUP_UPLOADS = os.environ.get('CLEANUP_UPLOADS', 'true').lower() == 'true'
    INCLUDE_IMAGE_IN_RESPONSE = os.environ.get('INCLUDE_IMAGE_IN_RESPONSE', 'false').lower() == 'true'

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    
class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    
class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    FACE_DATABASE_PATH = 'test_face_database.pkl'

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
