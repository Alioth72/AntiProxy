# face_detection.py
import cv2
import numpy as np
import logging
from insightface.app import FaceAnalysis

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceDetector:
    """
    Face detection class using SCRFD from the InsightFace library.
    
    SCRFD is a state-of-the-art, accurate, and fast face detector.
    """
    
    def __init__(self, **kwargs):
        """
        Initialize the SCRFD face detector.
        """
        try:
            # Initialize FaceAnalysis with SCRFD. 
            # It will automatically download the model on the first run.
            # We specify 'detection' as the only allowed module for speed.
            self.detector = FaceAnalysis(allowed_modules=['detection'])
            self.detector.prepare(ctx_id=0, det_size=(640, 640))
            logger.info("SCRFD face detector initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize SCRFD detector: {str(e)}")
            raise

    def detect_faces(self, image):
        """
        Detect faces in an image using SCRFD.
        
        Args:
            image (numpy.ndarray): Input image in BGR format (OpenCV format)
            
        Returns:
            list: List of detected faces with bounding boxes, confidence scores, and landmarks.
                  The format is kept compatible with the old MTCNN output.
        """
        try:
            # InsightFace's detector expects BGR images, so no color conversion is needed.
            results = self.detector.get(image)
            
            detected_faces = []
            
            for face in results:
                # Extract bounding box [x1, y1, x2, y2]
                bbox_coords = face.bbox.astype(int)
                x1, y1, x2, y2 = bbox_coords
                
                # Convert to [x, y, width, height] format
                bbox = [x1, y1, x2 - x1, y2 - y1]
                confidence = face.det_score
                
                # Extract facial landmarks (5 points)
                landmarks_coords = face.kps.astype(int)
                
                face_data = {
                    'bbox': bbox,
                    'confidence': float(confidence),
                    'landmarks': {
                        'left_eye': tuple(landmarks_coords[0]),
                        'right_eye': tuple(landmarks_coords[1]),
                        'nose': tuple(landmarks_coords[2]),
                        'mouth_left': tuple(landmarks_coords[3]),
                        'mouth_right': tuple(landmarks_coords[4])
                    }
                }
                
                detected_faces.append(face_data)
            
            # Sort faces by detection confidence score (highest first)
            detected_faces.sort(key=lambda f: f['confidence'], reverse=True)
            
            logger.info(f"Detected {len(detected_faces)} faces in the image")
            return detected_faces
            
        except Exception as e:
            logger.error(f"Face detection failed: {str(e)}")
            return []

    def get_largest_face(self, detections):
        """
        Get the largest face from a list of detections based on bbox area.
        
        Args:
            detections (list): List of face detections
            
        Returns:
            dict: Detection data for the largest face, or None if no faces
        """
        if not detections:
            return None
        
        largest_face = max(detections, key=lambda x: x['bbox'][2] * x['bbox'][3])
        return largest_face
    
    