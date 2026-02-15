"""
Embedding Store Service
Provides CRUD operations for face embeddings with both database and in-memory caching.
Supports fallback to JSON file when database is unavailable.
"""
import os
import json
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging
import threading

from database import db_manager, FaceEmbedding, get_db_session

logger = logging.getLogger(__name__)


class EmbeddingStore:
    """
    Service for managing face embeddings with database persistence and in-memory caching.
    
    Features:
    - In-memory cache for fast recognition
    - PostgreSQL persistence for durability
    - Fallback to JSON file when database unavailable
    - Thread-safe operations
    """
    
    def __init__(self, json_fallback_path: str = "reference_database.json"):
        self.json_fallback_path = json_fallback_path
        self._cache: Dict[str, dict] = {}  # {person_name: {embedding, person_id, ...}}
        self._lock = threading.RLock()
        self._use_database = db_manager.is_available()
        
        # Load initial data
        self._load_initial_data()
    
    def _load_initial_data(self):
        """Load embeddings from database or JSON fallback."""
        if self._use_database:
            self._load_from_database()
        else:
            self._load_from_json()
    
    def _load_from_database(self):
        """Load all embeddings from database into cache."""
        try:
            session = get_db_session()
            if session is None:
                logger.warning("Database session unavailable, falling back to JSON")
                self._use_database = False
                self._load_from_json()
                return
            
            embeddings = session.query(FaceEmbedding).all()
            
            with self._lock:
                self._cache.clear()
                for emb in embeddings:
                    self._cache[emb.person_name] = {
                        'id': str(emb.id),
                        'person_id': emb.person_id,
                        'embedding': emb.embedding,
                        'created_at': emb.created_at.isoformat() if emb.created_at else None,
                    }
            
            session.close()
            logger.info(f"✅ Loaded {len(self._cache)} embeddings from database")
            
        except Exception as e:
            logger.error(f"❌ Failed to load from database: {e}")
            self._use_database = False
            self._load_from_json()
    
    def _load_from_json(self):
        """Load embeddings from JSON file (fallback)."""
        try:
            if os.path.exists(self.json_fallback_path):
                with open(self.json_fallback_path, 'r') as f:
                    data = json.load(f)
                
                with self._lock:
                    self._cache.clear()
                    for name, person_data in data.get('people', {}).items():
                        self._cache[name] = {
                            'id': person_data.get('id', name),
                            'person_id': person_data.get('person_id'),
                            'embedding': person_data.get('embedding', []),
                            'created_at': person_data.get('created_at'),
                        }
                
                logger.info(f"✅ Loaded {len(self._cache)} embeddings from JSON file")
            else:
                logger.warning(f"⚠️ JSON file not found: {self.json_fallback_path}")
                
        except Exception as e:
            logger.error(f"❌ Failed to load from JSON: {e}")
    
    def add_person(
        self,
        person_name: str,
        embedding: np.ndarray,
        person_id: Optional[str] = None,
        update_if_exists: bool = False
    ) -> dict:
        """
        Add a new person with their face embedding.
        
        Args:
            person_name: Name of the person
            embedding: Face embedding vector (512-dim numpy array)
            person_id: Optional external ID (e.g., roll number)
            update_if_exists: If True, update existing person; if False, reject duplicates
            
        Returns:
            dict with status and details
        """
        # Validate inputs
        if not person_name or not person_name.strip():
            return {'success': False, 'error': 'Person name is required'}
        
        person_name = person_name.strip()
        
        if embedding is None or len(embedding) == 0:
            return {'success': False, 'error': 'Valid embedding is required'}
        
        # Convert numpy array to list for storage
        embedding_list = embedding.tolist() if isinstance(embedding, np.ndarray) else embedding
        
        with self._lock:
            # Check for existing person
            exists = person_name in self._cache
            
            if exists and not update_if_exists:
                return {
                    'success': False,
                    'error': f'Person "{person_name}" already exists. Use update_if_exists=True to overwrite.'
                }
            
            try:
                # Store in database if available
                if self._use_database:
                    result = self._store_in_database(person_name, embedding_list, person_id, exists)
                    if not result['success']:
                        return result
                    record_id = result['id']
                else:
                    record_id = person_name
                    # Store in JSON fallback
                    self._save_to_json()
                
                # Update cache
                self._cache[person_name] = {
                    'id': record_id,
                    'person_id': person_id,
                    'embedding': embedding_list,
                    'created_at': datetime.utcnow().isoformat(),
                }
                
                action = "updated" if exists else "added"
                logger.info(f"✅ Person '{person_name}' {action} successfully")
                
                return {
                    'success': True,
                    'action': action,
                    'person_name': person_name,
                    'person_id': record_id,
                }
                
            except Exception as e:
                logger.error(f"❌ Failed to add person: {e}")
                return {'success': False, 'error': str(e)}
    
    def _store_in_database(
        self,
        person_name: str,
        embedding: List[float],
        person_id: Optional[str],
        update: bool
    ) -> dict:
        """Store embedding in PostgreSQL database."""
        session = get_db_session()
        if session is None:
            return {'success': False, 'error': 'Database unavailable'}
        
        try:
            if update:
                # Update existing record
                record = session.query(FaceEmbedding).filter(
                    FaceEmbedding.person_name == person_name
                ).first()
                
                if record:
                    record.embedding = embedding
                    record.person_id = person_id
                    record.updated_at = datetime.utcnow()
                else:
                    # Record doesn't exist in DB but was in cache - create new
                    record = FaceEmbedding(
                        person_name=person_name,
                        person_id=person_id,
                        embedding=embedding,
                    )
                    session.add(record)
            else:
                # Create new record
                record = FaceEmbedding(
                    person_name=person_name,
                    person_id=person_id,
                    embedding=embedding,
                )
                session.add(record)
            
            session.commit()
            record_id = str(record.id)
            session.close()
            
            return {'success': True, 'id': record_id}
            
        except Exception as e:
            session.rollback()
            session.close()
            logger.error(f"Database error: {e}")
            return {'success': False, 'error': str(e)}
    
    def remove_person(self, person_name: str) -> dict:
        """
        Remove a person from the database.
        
        Args:
            person_name: Name of the person to remove
            
        Returns:
            dict with status
        """
        with self._lock:
            if person_name not in self._cache:
                return {'success': False, 'error': f'Person "{person_name}" not found'}
            
            try:
                # Remove from database
                if self._use_database:
                    session = get_db_session()
                    if session:
                        session.query(FaceEmbedding).filter(
                            FaceEmbedding.person_name == person_name
                        ).delete()
                        session.commit()
                        session.close()
                
                # Remove from cache
                del self._cache[person_name]
                
                # Update JSON fallback
                if not self._use_database:
                    self._save_to_json()
                
                logger.info(f"✅ Person '{person_name}' removed successfully")
                return {'success': True, 'person_name': person_name}
                
            except Exception as e:
                logger.error(f"❌ Failed to remove person: {e}")
                return {'success': False, 'error': str(e)}
    
    def get_person(self, person_name: str) -> Optional[dict]:
        """Get a person's data by name."""
        with self._lock:
            return self._cache.get(person_name)
    
    def get_person_by_id(self, person_id: str) -> Optional[dict]:
        """Get a person's data by their ID (e.g., email)."""
        with self._lock:
            for name, data in self._cache.items():
                if data.get('person_id') == person_id:
                    return {**data, 'person_name': name}
            return None
    
    def get_all_persons(self) -> List[str]:
        """Get list of all enrolled person names."""
        with self._lock:
            return sorted(list(self._cache.keys()))
    
    def get_all_persons_with_ids(self) -> List[dict]:
        """Get list of all enrolled persons with their IDs."""
        with self._lock:
            return [
                {'name': name, 'id': data.get('person_id')}
                for name, data in sorted(self._cache.items())
            ]
    
    def get_person_count(self) -> int:
        """Get total number of enrolled persons."""
        with self._lock:
            return len(self._cache)
    
    def find_best_match(
        self,
        embedding: np.ndarray,
        similarity_threshold: float = 0.0
    ) -> Tuple[Optional[str], float]:
        """
        Find the best matching person for a given embedding.
        
        Args:
            embedding: Face embedding to match (512-dim)
            similarity_threshold: Minimum similarity score to accept (cosine similarity)
            
        Returns:
            Tuple of (person_name, similarity_score) or (None, best_score) if no match
        """
        if embedding is None:
            return None, -1.0
        
        best_match = None
        best_similarity = -1.0
        
        emb_array = np.array(embedding)
        
        with self._lock:
            for person_name, person_data in self._cache.items():
                ref_embedding = np.array(person_data['embedding'])
                
                # Calculate cosine similarity
                similarity = self._cosine_similarity(emb_array, ref_embedding)
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = person_name
        
        # Return match only if above threshold
        if best_similarity > similarity_threshold:
            return best_match, best_similarity
        else:
            return None, best_similarity
    
    def find_best_match_with_id(
        self,
        embedding: np.ndarray,
        similarity_threshold: float = 0.0,
        allowed_person_ids: Optional[List[str]] = None
    ) -> Optional[dict]:
        """
        Find the best matching person and return complete person data.
        
        Args:
            embedding: Face embedding to match (512-dim)
            similarity_threshold: Minimum similarity score to accept (cosine similarity)
            allowed_person_ids: Optional list of person_ids to restrict search to (e.g., roll numbers)
            
        Returns:
            dict with {name, person_id, similarity} or None if no match above threshold
        """
        if embedding is None:
            return None
        
        best_match_name = None
        best_match_id = None
        best_similarity = -1.0
        
        emb_array = np.array(embedding)
        
        with self._lock:
            for person_name, person_data in self._cache.items():
                person_id = person_data.get('person_id')
                
                # If allowed_person_ids is specified, filter by person_id
                if allowed_person_ids is not None:
                    if person_id is None or person_id not in allowed_person_ids:
                        continue
                
                ref_embedding = np.array(person_data['embedding'])
                
                # Calculate cosine similarity
                similarity = self._cosine_similarity(emb_array, ref_embedding)
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match_name = person_name
                    best_match_id = person_id
        
        # Return match only if above threshold
        if best_similarity > similarity_threshold:
            return {
                "name": best_match_name,
                "person_id": best_match_id,
                "similarity": float(best_similarity)
            }
        else:
            return None
    
    @staticmethod
    def _cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Calculate cosine similarity between two embeddings."""
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return -1.0
        
        return dot_product / (norm1 * norm2)
    
    def _save_to_json(self):
        """Save current cache to JSON file (for fallback mode)."""
        try:
            data = {
                'metadata': {
                    'updated_at': datetime.utcnow().isoformat(),
                    'total_persons': len(self._cache),
                },
                'people': {}
            }
            
            for name, person_data in self._cache.items():
                data['people'][name] = {
                    'id': person_data.get('id', name),
                    'person_id': person_data.get('person_id'),
                    'embedding': person_data['embedding'],
                    'created_at': person_data.get('created_at'),
                }
            
            with open(self.json_fallback_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"✅ Saved {len(self._cache)} embeddings to JSON")
            
        except Exception as e:
            logger.error(f"❌ Failed to save to JSON: {e}")
    
    def reload(self):
        """Reload embeddings from storage."""
        self._load_initial_data()
    
    def get_status(self) -> dict:
        """Get current status of the embedding store."""
        return {
            'total_persons': self.get_person_count(),
            'storage_mode': 'database' if self._use_database else 'json',
            'database_available': db_manager.is_available(),
            'persons': self.get_all_persons(),
        }


# Global embedding store instance
embedding_store = EmbeddingStore()


def get_embedding_store() -> EmbeddingStore:
    """Get the global embedding store instance."""
    return embedding_store
