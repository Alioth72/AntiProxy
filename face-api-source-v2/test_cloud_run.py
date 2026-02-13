#!/usr/bin/env python3
import base64
import json
import requests
import subprocess
import sys

def get_token():
    """Get Google Cloud identity token"""
    return subprocess.getoutput('gcloud auth print-identity-token')

def test_face_recognition(image_path, service_url):
    """Test face recognition endpoint"""
    # Read and encode image
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    # Get auth token
    token = get_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    payload = {'image_data': image_data}
    
    # Send request
    print(f"Testing {image_path}...")
    response = requests.post(
        f'{service_url}/recognize_faces',
        headers=headers,
        json=payload,
        timeout=60
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {result.get('status')}")
        print(f"✅ Faces detected: {len(result.get('faces', []))}")
        
        # Show first 5 faces
        faces = result.get('faces', [])
        for i, face in enumerate(faces[:5]):
            print(f"  Face {i+1}: {face.get('name')} (similarity: {face.get('similarity_score', 0):.4f})")
        
        if len(faces) > 5:
            print(f"  ... and {len(faces) - 5} more faces")
        
        return True
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        return False

if __name__ == '__main__':
    service_url = 'https://face-api-612272896050.asia-south1.run.app'
    
    # Test with aims_fotu.jpg
    test_face_recognition('aims_fotu.jpg', service_url)
