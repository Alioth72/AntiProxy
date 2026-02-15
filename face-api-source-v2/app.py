from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import cv2
import numpy as np
from face_detection import FaceDetector
from face_recognition import FaceRecognizer
from face_alignment import FaceAligner
import json
import base64
from datetime import datetime
from config import config
from database import init_database, db_manager
from embedding_store import embedding_store, get_embedding_store

app = Flask(__name__)

# Load configuration
config_name = os.environ.get('FLASK_CONFIG', 'development')
app.config.from_object(config[config_name])

# Configuration
UPLOAD_FOLDER = app.config['UPLOAD_FOLDER']
ALLOWED_EXTENSIONS = app.config['ALLOWED_EXTENSIONS']
MAX_CONTENT_LENGTH = app.config['MAX_CONTENT_LENGTH']

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize face detection and recognition modules
# Using SCRFD detector from InsightFace (no config params needed)
face_detector = FaceDetector()
face_recognizer = FaceRecognizer()
face_aligner = FaceAligner()

# Initialize database and embedding store
print("🔧 Initializing database...")
if init_database():
    print("✅ Database initialized successfully")
else:
    print("⚠️ Database not available, using JSON fallback")

print(f"✅ Embedding store ready with {embedding_store.get_person_count()} people")

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def decode_base64_image(base64_string):
    """Decode base64 string to OpenCV image."""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode to OpenCV image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")

def calculate_cosine_similarity(embedding1, embedding2):
    """Calculate cosine similarity between two embeddings."""
    emb1 = np.array(embedding1)
    emb2 = np.array(embedding2)
    
    # Calculate cosine similarity
    dot_product = np.dot(emb1, emb2)
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    
    if norm1 == 0 or norm2 == 0:
        return -1.0  # Maximum dissimilarity
    
    cosine_sim = dot_product / (norm1 * norm2)
    return cosine_sim

def find_best_match(face_embedding, similarity_threshold=0.0, allowed_person_ids=None):
    """
    Find the best matching person using the embedding store.
    
    Args:
        face_embedding: Face embedding to match
        similarity_threshold: Minimum similarity score to accept
        allowed_person_ids: Optional list of person_ids to restrict search
        
    Returns:
        Tuple of (person_name, similarity_score, person_id) or (None, -1.0, None) if no match
    """
    if face_embedding is None:
        print("❌ Face embedding is None")
        return None, -1.0, None
    
    print(f"🔍 Searching for match among {embedding_store.get_person_count()} people")
    if allowed_person_ids:
        print(f"🔍 Restricting search to {len(allowed_person_ids)} allowed person_ids")
    print(f"📊 Face embedding shape: {face_embedding.shape}")
    print(f"📊 Face embedding norm: {np.linalg.norm(face_embedding):.6f}")
    
    # Use embedding store for matching with optional filter
    match_data = embedding_store.find_best_match_with_id(
        face_embedding, 
        similarity_threshold,
        allowed_person_ids
    )
    
    if match_data:
        print(f"🎯 Best match: {match_data['name']} (ID: {match_data['person_id']}) with similarity: {match_data['similarity']:.6f}")
        print(f"✅ Match accepted")
        return match_data['name'], match_data['similarity'], match_data['person_id']
    else:
        print(f"❌ No match found above threshold {similarity_threshold}")
        return None, -1.0, None


def encode_image_to_base64(image_path):
    """Encode image to base64 string."""
    with open(image_path, 'rb') as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string

def encode_cv2_image_to_base64(cv2_image):
    """Encode OpenCV image directly to base64 string."""
    try:
        # Encode image to memory buffer
        success, buffer = cv2.imencode('.jpg', cv2_image)
        if success:
            # Convert to base64
            encoded_string = base64.b64encode(buffer).decode('utf-8')
            return encoded_string
        else:
            return None
    except Exception as e:
        print(f"Error encoding image to base64: {e}")
        return None

def draw_face_annotation(image, bbox, person_name, similarity_score):
    """
    Draw face annotation on the image.
    
    Args:
        image (numpy.ndarray): Image to annotate
        bbox (dict): Bounding box with 'left', 'top', 'width', 'height'
        person_name (str): Identified person name
        similarity_score (float): Similarity score
        
    Returns:
        numpy.ndarray: Annotated image
    """
    x = int(bbox['left'])
    y = int(bbox['top'])
    w = int(bbox['width'])
    h = int(bbox['height'])
    
    # Choose color based on similarity score
    if similarity_score > 0.7:
        color = (0, 255, 0)  # Green for high confidence
    elif similarity_score > 0.5:
        color = (0, 165, 255)  # Orange for medium confidence
    else:
        color = (0, 0, 255)  # Red for low confidence
    
    # Draw bounding box
    cv2.rectangle(image, (x, y), (x + w, y + h), color, 2)
    
    # Prepare text
    name_text = person_name if person_name else "Unknown"
    similarity_text = f"{similarity_score:.3f}"
    
    # Font settings
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    thickness = 2
    
    # Get text sizes
    (name_w, name_h), _ = cv2.getTextSize(name_text, font, font_scale, thickness)
    (sim_w, sim_h), _ = cv2.getTextSize(similarity_text, font, font_scale, thickness)
    
    # Draw background rectangles for text
    text_bg_color = (0, 0, 0)
    text_color = (255, 255, 255)
    
    # Name background and text
    cv2.rectangle(image, (x, y - name_h - 10), (x + name_w + 10, y), text_bg_color, -1)
    cv2.putText(image, name_text, (x + 5, y - 5), font, font_scale, text_color, thickness)
    
    # Similarity score background and text
    cv2.rectangle(image, (x, y + h), (x + sim_w + 10, y + h + sim_h + 10), text_bg_color, -1)
    cv2.putText(image, similarity_text, (x + 5, y + h + sim_h + 5), font, font_scale, text_color, thickness)
    
    return image

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with database status."""
    db_health = db_manager.health_check()
    store_status = embedding_store.get_status()
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'Face Recognition API is running',
        'database': db_health,
        'embedding_store': {
            'total_persons': store_status['total_persons'],
            'storage_mode': store_status['storage_mode'],
        }
    })


@app.route('/embedding_status', methods=['GET'])
def embedding_status():
    """Get detailed status of the embedding store."""
    try:
        status = embedding_store.get_status()
        db_health = db_manager.health_check()
        
        return jsonify({
            'status': 'success',
            'embedding_store': status,
            'database': db_health,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/reload_embeddings', methods=['POST'])
def reload_embeddings():
    """Reload embeddings from storage (database or JSON)."""
    try:
        embedding_store.reload()
        status = embedding_store.get_status()
        
        return jsonify({
            'status': 'success',
            'message': f"Reloaded {status['total_persons']} persons",
            'embedding_store': status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/migrate_json_to_db', methods=['POST'])
def migrate_json_to_db():
    """
    Migrate embeddings from JSON file to database.
    One-time operation to transfer existing data.
    """
    try:
        json_path = 'reference_database.json'
        
        if not os.path.exists(json_path):
            return jsonify({
                'status': 'error',
                'error': f'JSON file not found: {json_path}',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        # Load JSON data
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        people = data.get('people', {})
        migrated = 0
        skipped = 0
        errors = []
        
        for name, person_data in people.items():
            embedding = person_data.get('embedding', [])
            if not embedding:
                errors.append(f"{name}: no embedding")
                continue
            
            # Check if already exists
            existing = embedding_store.get_person(name)
            if existing:
                skipped += 1
                continue
            
            # Add to database
            result = embedding_store.add_person(
                person_name=name,
                embedding=np.array(embedding),
                person_id=person_data.get('person_id'),
                update_if_exists=False
            )
            
            if result['success']:
                migrated += 1
            else:
                errors.append(f"{name}: {result.get('error', 'unknown error')}")
        
        return jsonify({
            'status': 'success',
            'message': f'Migration complete',
            'migrated': migrated,
            'skipped': skipped,
            'errors': errors,
            'total_in_db': embedding_store.get_person_count(),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/recognize_faces', methods=['POST'])
def recognize_faces():
    """
    Process a Base64 encoded image for face recognition.
    
    Expected input format:
    {
        "image_data": "base64_encoded_image_string",
        "allowed_person_ids": ["2K24/AIMS/01", "2K24/AIMS/02", ...]  // Optional: restrict to class roster
    }
    
    Returns JSON with face recognition results including person_id.
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data or 'image_data' not in data:
            return jsonify({
                'error': 'No image_data provided in JSON request',
                'status': 'error'
            }), 400
        
        # Get optional allowed_person_ids filter (list of roll numbers)
        allowed_person_ids = data.get('allowed_person_ids', None)
        if allowed_person_ids:
            print(f"🔒 Restricting recognition to {len(allowed_person_ids)} person_ids from class roster")
        
        # Decode base64 image
        try:
            image = decode_base64_image(data['image_data'])
            if image is None:
                raise ValueError("Failed to decode image")
        except Exception as e:
            return jsonify({
                'error': f'Invalid image data: {str(e)}',
                'status': 'error'
            }), 400
        
        # Check if embedding store has any people
        if embedding_store.get_person_count() == 0:
            return jsonify({
                'error': 'No enrolled persons. Please add persons using /add_person endpoint.',
                'status': 'error'
            }), 500
        
        # Perform face detection
        detection_results = face_detector.detect_faces(image)
        
        # Process each detected face
        results_json = []
        annotated_image = image.copy()  # Create a copy for annotation
        
        for detection in detection_results:
            face_bbox = detection['bbox']
            landmarks = detection['landmarks']
            detection_confidence = detection['confidence']
            
            # Convert bbox to the required format
            x, y, w, h = [float(coord) for coord in face_bbox]
            
            try:
                # Align and preprocess face for recognition
                print(f"🔄 Processing face with bbox: {face_bbox}")
                aligned_face = face_aligner.align_face(image, landmarks, face_bbox)
                print(f"✅ Face aligned, shape: {aligned_face.shape}")
                
                # Extract embedding using the face recognizer
                embedding = face_recognizer.extract_embedding(aligned_face)
                print(f"🧠 Embedding extracted: {embedding is not None}")
                
                if embedding is not None:
                    print(f"📊 Embedding shape: {embedding.shape}, norm: {np.linalg.norm(embedding):.6f}")
                    
                    # Find best match in reference database (with optional filter)
                    person_name, similarity_score, person_id = find_best_match(embedding, allowed_person_ids=allowed_person_ids)
                    
                    # Create result entry
                    face_result = {
                        "boundingBox": {
                            "left": x,
                            "top": y,
                            "width": w,
                            "height": h
                        },
                        "name": person_name if person_name else "Unknown",
                        "personId": person_id if person_id else None,
                        "similarityScore": float(similarity_score) if similarity_score > 0 else 0.0
                    }
                    
                    print(f"🎯 Final result: {person_name} (ID: {person_id}) (similarity: {similarity_score:.6f})")
                    results_json.append(face_result)
                    
                    # Draw annotation on the image
                    annotated_image = draw_face_annotation(
                        annotated_image, 
                        face_result["boundingBox"], 
                        face_result["name"], 
                        face_result["similarityScore"]
                    )
                else:
                    print("❌ Failed to extract embedding")
                    # Still create result for unknown face
                    face_result = {
                        "boundingBox": {
                            "left": x,
                            "top": y,
                            "width": w,
                            "height": h
                        },
                        "name": "Unknown",
                        "personId": None,
                        "similarityScore": 0.0
                    }
                    results_json.append(face_result)
                    
                    # Draw annotation for unknown face
                    annotated_image = draw_face_annotation(
                        annotated_image, 
                        face_result["boundingBox"], 
                        face_result["name"], 
                        face_result["similarityScore"]
                    )
                
            except Exception as e:
                print(f"❌ Face processing error: {str(e)}")
                # If face processing fails, still include the detection with Unknown
                face_result = {
                    "boundingBox": {
                        "left": x,
                        "top": y,
                        "width": w,
                        "height": h
                    },
                    "name": "Unknown",
                    "personId": None,
                    "similarityScore": 0.0
                }
                results_json.append(face_result)
                
                # Draw annotation for failed processing
                annotated_image = draw_face_annotation(
                    annotated_image, 
                    face_result["boundingBox"], 
                    face_result["name"], 
                    face_result["similarityScore"]
                )
        
        # Encode the annotated image to base64
        processed_image_base64 = encode_cv2_image_to_base64(annotated_image)
        
        # Return results in the specified format
        response = {
            "results_json": results_json
        }
        
        # Add processed image if encoding was successful
        if processed_image_base64:
            response["processed_image_base64"] = processed_image_base64
            print(f"✅ Annotated image encoded to base64")
        else:
            print("❌ Failed to encode annotated image")
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            'error': f'Processing failed: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/process_image', methods=['POST'])
def process_image():
    """
    Process an uploaded image for face detection and recognition.
    
    Returns JSON with detection results and face recognition data.
    """
    try:
        # Check if the post request has the file part
        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided',
                'status': 'error'
            }), 400
        
        file = request.files['image']
        
        # Check if user selected a file
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'status': 'error'
            }), 400
        
        # Check if file is allowed
        if not allowed_file(file.filename):
            return jsonify({
                'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}',
                'status': 'error'
            }), 400
        
        # Save the uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Read and process the image
        image = cv2.imread(filepath)
        if image is None:
            os.remove(filepath)  # Clean up
            return jsonify({
                'error': 'Invalid image file or corrupted image',
                'status': 'error'
            }), 400
        
        # Perform face detection
        detection_results = face_detector.detect_faces(image)
        
        # Perform face recognition for detected faces
        recognition_results = []
        for detection in detection_results:
            face_bbox = detection['bbox']
            confidence = detection['confidence']
            landmarks = detection['landmarks']
            
            # Extract face region
            x, y, w, h = face_bbox
            face_image = image[y:y+h, x:x+w]
            
            # Perform face recognition with landmarks for alignment
            recognition_result = face_recognizer.recognize_face(face_image, landmarks, face_bbox)
            
            recognition_results.append({
                'bbox': face_bbox,
                'detection_confidence': confidence,
                'landmarks': landmarks,
                'recognition': recognition_result
            })
        
        # Prepare response
        response_data = {
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'filename': filename,
            'image_info': {
                'width': image.shape[1],
                'height': image.shape[0],
                'channels': image.shape[2]
            },
            'total_faces_detected': len(detection_results),
            'results': recognition_results
        }
        
        # Optional: include base64 encoded image in response
        include_image = request.form.get('include_image', 'false').lower() == 'true'
        if include_image:
            response_data['image_base64'] = encode_image_to_base64(filepath)
        
        # Clean up uploaded file (optional - you might want to keep it)
        cleanup = request.form.get('cleanup', 'true').lower() == 'true'
        if cleanup:
            os.remove(filepath)
        
        return jsonify(response_data)
    
    except Exception as e:
        # Clean up file if it exists
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        
        return jsonify({
            'error': f'Processing failed: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/add_person', methods=['POST'])
def add_person():
    """
    Add a new person to the face recognition database.
    
    Expects:
        - image: Image file (form-data)
        - name: Person name (form field, required)
        - id: Optional external ID like roll number (form field)
        - update: Set to 'true' to update existing person (form field)
    
    Returns JSON with enrollment status.
    """
    filepath = None
    try:
        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided',
                'status': 'error'
            }), 400
        
        file = request.files['image']
        person_name = request.form.get('name', '').strip()
        person_id = request.form.get('id', '').strip() or None
        update_if_exists = request.form.get('update', 'false').lower() == 'true'
        
        if not person_name:
            return jsonify({
                'error': 'Person name is required',
                'status': 'error'
            }), 400
        
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file. Allowed extensions: png, jpg, jpeg, gif, bmp',
                'status': 'error'
            }), 400
        
        # Save the uploaded file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"person_{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Read and process the image
        image = cv2.imread(filepath)
        if image is None:
            return jsonify({
                'error': 'Invalid image file - could not read image',
                'status': 'error'
            }), 400
        
        # Detect faces to get landmarks for alignment
        detection_results = face_detector.detect_faces(image)
        
        if not detection_results:
            return jsonify({
                'error': 'No face detected in the image. Please upload a clear photo with a visible face.',
                'status': 'error'
            }), 400
        
        if len(detection_results) > 1:
            print(f"⚠️ Multiple faces detected ({len(detection_results)}), using the largest one")
        
        # Use the largest face if multiple faces are detected
        largest_face = face_detector.get_largest_face(detection_results)
        face_bbox = largest_face['bbox']
        landmarks = largest_face['landmarks']
        
        # Align face for embedding extraction
        aligned_face = face_aligner.align_face(image, landmarks, face_bbox)
        
        # Extract embedding
        embedding = face_recognizer.extract_embedding(aligned_face)
        
        if embedding is None:
            return jsonify({
                'error': 'Failed to extract face embedding. Please try with a different image.',
                'status': 'error'
            }), 400
        
        # Add to embedding store (persists to database)
        result = embedding_store.add_person(
            person_name=person_name,
            embedding=embedding,
            person_id=person_id,
            update_if_exists=update_if_exists
        )
        
        if result['success']:
            return jsonify({
                'status': 'success',
                'message': f"Person '{person_name}' {result['action']} successfully",
                'person_name': person_name,
                'person_id': result.get('person_id'),
                'action': result['action'],
                'total_enrolled': embedding_store.get_person_count(),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'error',
                'error': result['error'],
                'timestamp': datetime.now().isoformat()
            }), 400
    
    except Exception as e:
        return jsonify({
            'error': f'Failed to add person: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500
    
    finally:
        # Clean up temporary file
        if filepath and os.path.exists(filepath):
            os.remove(filepath)


@app.route('/remove_person/<person_name>', methods=['DELETE'])
def remove_person(person_name):
    """
    Remove a person from the face recognition database.
    
    Args:
        person_name: Name of the person to remove (URL parameter)
    
    Returns JSON with removal status.
    """
    try:
        result = embedding_store.remove_person(person_name)
        
        if result['success']:
            return jsonify({
                'status': 'success',
                'message': f"Person '{person_name}' removed successfully",
                'person_name': person_name,
                'total_enrolled': embedding_store.get_person_count(),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'error',
                'error': result['error'],
                'timestamp': datetime.now().isoformat()
            }), 404
    
    except Exception as e:
        return jsonify({
            'error': f'Failed to remove person: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/list_persons', methods=['GET'])
def list_persons():
    """List all persons in the face recognition database."""
    try:
        persons = embedding_store.get_all_persons()
        return jsonify({
            'status': 'success',
            'total_persons': len(persons),
            'persons': persons,
            'storage_mode': embedding_store.get_status()['storage_mode'],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'error': f'Failed to list persons: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/check_person', methods=['GET'])
def check_person():
    """
    Check if a person is enrolled in the face recognition database.
    
    Query parameters:
        - name: Person name to check
        - id: Person ID (e.g., email) to check
    
    At least one of name or id must be provided.
    """
    try:
        name = request.args.get('name', '').strip()
        person_id = request.args.get('id', '').strip()
        
        if not name and not person_id:
            return jsonify({
                'error': 'Either name or id parameter is required',
                'status': 'error'
            }), 400
        
        found = False
        person_data = None
        
        # Check by ID first (more specific)
        if person_id:
            person_data = embedding_store.get_person_by_id(person_id)
            if person_data:
                found = True
        
        # If not found by ID and name is provided, check by name
        if not found and name:
            person_data = embedding_store.get_person(name)
            if person_data:
                found = True
                person_data['person_name'] = name
        
        return jsonify({
            'status': 'success',
            'enrolled': found,
            'person_name': person_data.get('person_name') if person_data else None,
            'person_id': person_data.get('person_id') if person_data else None,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to check person: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({
        'error': 'File too large. Maximum size is 16MB',
        'status': 'error'
    }), 413

if __name__ == '__main__':
    app.run(
        debug=app.config['DEBUG'], 
        host=app.config['HOST'], 
        port=app.config['PORT']
    )
