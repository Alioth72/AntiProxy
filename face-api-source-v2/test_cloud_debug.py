#!/usr/bin/env python3
"""
Comprehensive debugging test for Cloud Run face API
"""
import base64
import json
import requests
import subprocess
import sys
import time

SERVICE_URL = 'https://face-api-27dvlwurxq-el.a.run.app'

def get_auth_token():
    """Get Google Cloud identity token"""
    print("📋 Getting authentication token...")
    token = subprocess.getoutput('gcloud auth print-identity-token')
    if token and not token.startswith('ERROR'):
        print("✅ Token obtained")
        return token
    else:
        print(f"❌ Failed to get token: {token}")
        return None

def test_health_endpoint():
    """Test the /health endpoint"""
    print("\n" + "="*80)
    print("STEP 1: Testing /health endpoint")
    print("="*80)
    
    token = get_auth_token()
    if not token:
        return False
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f'{SERVICE_URL}/health', headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_face_recognition(image_path):
    """Test face recognition with detailed debugging"""
    print("\n" + "="*80)
    print(f"STEP 2: Testing /recognize_faces with {image_path}")
    print("="*80)
    
    # Read and encode image
    print(f"📸 Reading image: {image_path}")
    try:
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        file_size_mb = len(image_bytes) / (1024 * 1024)
        print(f"✅ Image loaded: {file_size_mb:.2f} MB")
    except Exception as e:
        print(f"❌ Failed to read image: {e}")
        return False
    
    # Encode to base64
    print("🔄 Encoding image to base64...")
    image_data = base64.b64encode(image_bytes).decode('utf-8')
    print(f"✅ Base64 encoded: {len(image_data)} characters")
    
    # Get auth token
    token = get_auth_token()
    if not token:
        return False
    
    # Prepare request
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {'image_data': image_data}
    payload_size_mb = len(json.dumps(payload)) / (1024 * 1024)
    print(f"📦 Payload size: {payload_size_mb:.2f} MB")
    
    # Send request
    print(f"🚀 Sending POST request to {SERVICE_URL}/recognize_faces")
    print("⏳ Waiting for response (timeout: 120s)...")
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f'{SERVICE_URL}/recognize_faces',
            headers=headers,
            json=payload,
            timeout=120
        )
        elapsed = time.time() - start_time
        
        print(f"\n⏱️  Response time: {elapsed:.2f} seconds")
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Content-Type: {response.headers.get('Content-Type')}")
        print(f"📏 Response size: {len(response.content)} bytes")
        
        if response.status_code == 200:
            print("\n✅ SUCCESS - Got 200 OK")
            
            # Parse JSON response
            try:
                result = response.json()
                print(f"\n📦 Response structure:")
                print(f"   Top-level keys: {list(result.keys())}")
                
                # Check for results_json
                if 'results_json' in result:
                    faces = result['results_json']
                    print(f"\n🎯 FACES DETECTED: {len(faces)}")
                    
                    if faces:
                        print(f"\n👥 Face Details:")
                        for i, face in enumerate(faces[:5], 1):
                            name = face.get('name', 'Unknown')
                            score = face.get('similarityScore', 0)
                            bbox = face.get('boundingBox', {})
                            print(f"   {i}. {name} (similarity: {score:.4f})")
                            print(f"      Location: ({bbox.get('left')}, {bbox.get('top')}), "
                                  f"Size: {bbox.get('width')}x{bbox.get('height')}")
                        
                        if len(faces) > 5:
                            print(f"   ... and {len(faces) - 5} more faces")
                        
                        return True
                    else:
                        print("⚠️  No faces detected in image")
                        return False
                else:
                    print(f"⚠️  'results_json' key not found in response")
                    print(f"   Available keys: {list(result.keys())}")
                    return False
                    
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                print(f"   Raw response (first 500 chars): {response.text[:500]}")
                return False
        
        elif response.status_code == 503:
            print("\n❌ SERVICE UNAVAILABLE (503)")
            print("   Possible causes:")
            print("   - Service is cold starting (models loading)")
            print("   - Request timeout")
            print("   - Memory/CPU limits exceeded")
            print(f"   Response: {response.text}")
            return False
        
        else:
            print(f"\n❌ ERROR - Status {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        elapsed = time.time() - start_time
        print(f"\n❌ REQUEST TIMEOUT after {elapsed:.2f} seconds")
        print("   The service is taking too long to respond")
        return False
    
    except Exception as e:
        print(f"\n❌ EXCEPTION: {type(e).__name__}: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("🧪 CLOUD RUN FACE API - COMPREHENSIVE DEBUG TEST")
    print("="*80)
    print(f"Service URL: {SERVICE_URL}")
    print(f"Image: aims_fotu2.jpg")
    
    # Test health endpoint
    health_ok = test_health_endpoint()
    
    if not health_ok:
        print("\n⚠️  Health check failed, but continuing with face recognition test...")
    
    # Test face recognition
    success = test_face_recognition('aims_fotu2.jpg')
    
    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"Health endpoint: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Face recognition: {'✅ PASS' if success else '❌ FAIL'}")
    print("="*80 + "\n")
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
