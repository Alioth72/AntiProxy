# face_recognition.py
import cv2
import numpy as np
import os
from datetime import datetime
import logging
from insightface.app import FaceAnalysis

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceRecognizer:
    """
    Face recognition class using the InsightFace library for generating embeddings.
    """

    def __init__(self):
        """
        Initialize the face recognizer.
        """
        try:
            # Load both 'detection' and 'recognition' to satisfy the FaceAnalysis class requirements.
            self.model = FaceAnalysis(allowed_modules=['detection', 'recognition'])
            self.model.prepare(ctx_id=-1) # Use -1 for CPU
            logger.info("InsightFace recognizer initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize InsightFace recognizer: {e}")
            raise

    def extract_embedding(self, aligned_face):
        """
        Extract face embedding using the InsightFace recognition model directly.
        
        Args:
            aligned_face (numpy.ndarray): A pre-cropped and aligned face image (112x112)
            
        Returns:
            numpy.ndarray: Face embedding vector (512-dimensional)
        """
        try:
            # CORRECTION: Access the recognition model via the 'models' dictionary.
            embedding = self.model.models['recognition'].get_feat([aligned_face])[0]
            return embedding
        except Exception as e:
            logger.error(f"Embedding extraction failed: {str(e)}")
            return None