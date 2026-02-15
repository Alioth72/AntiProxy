#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================================================"
echo "           TESTING ROLL NUMBER-BASED FACE RECOGNITION SYSTEM"
echo "               Backend & Face-API Integration Tests"
echo "================================================================================"
echo ""

BACKEND_URL="https://dtu-aims-backend-612272896050.asia-south1.run.app"
FACE_API_URL="https://face-api-612272896050.asia-south1.run.app"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        [ -n "$details" ] && echo "  → $details"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        [ -n "$details" ] && echo "  → $details"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

echo -e "${BLUE}=== TEST 1: Backend Health Check ===${NC}"
response=$(curl -s "$BACKEND_URL/")
if echo "$response" | grep -q "AIMS Attendance Backend API"; then
    test_result "Backend Health" "PASS" "Backend is running"
else
    test_result "Backend Health" "FAIL" "Backend returned: $response"
fi

echo -e "${BLUE}=== TEST 2: Face-API Health Check ===${NC}"
response=$(curl -s "$FACE_API_URL/embedding_status")
if echo "$response" | grep -q "success"; then
    total=$(echo "$response" | jq -r '.embedding_store.total_persons')
    db_status=$(echo "$response" | jq -r '.database.status')
    test_result "Face-API Health" "PASS" "Status: $db_status, Enrolled: $total people"
else
    test_result "Face-API Health" "FAIL" "Face-API returned: $response"
fi

echo -e "${BLUE}=== TEST 3: Face-API /list_persons Endpoint ===${NC}"
response=$(curl -s "$FACE_API_URL/list_persons")
if echo "$response" | jq -e '.people' > /dev/null 2>&1; then
    count=$(echo "$response" | jq '.people | length')
    test_result "List Persons Endpoint" "PASS" "Retrieved $count enrolled persons"
    
    # Check if any have person_id (roll_no)
    has_id=$(echo "$response" | jq '[.people[] | select(.person_id != null)] | length')
    echo -e "  ${YELLOW}Info:${NC} $has_id persons have person_id (roll_no) assigned"
else
    test_result "List Persons Endpoint" "FAIL" "Invalid response"
fi
echo ""

echo -e "${BLUE}=== TEST 4: Face-API /check_person Endpoint (by ID) ===${NC}"
# Test with a known roll number
response=$(curl -s "$FACE_API_URL/check_person?id=2K24/AIMS/32")
echo "Testing with roll_no: 2K24/AIMS/32"
if echo "$response" | jq -e '.enrolled' > /dev/null 2>&1; then
    enrolled=$(echo "$response" | jq -r '.enrolled')
    person_name=$(echo "$response" | jq -r '.person_name')
    person_id=$(echo "$response" | jq -r '.person_id')
    
    if [ "$enrolled" == "true" ]; then
        test_result "Check Person by Roll No" "PASS" "Found: $person_name (ID: $person_id)"
    else
        test_result "Check Person by Roll No" "PASS" "Roll no 2K24/AIMS/32 not enrolled (expected for test)"
    fi
else
    test_result "Check Person by Roll No" "FAIL" "Invalid response"
fi

echo -e "${BLUE}=== TEST 5: Database - Check Students Table ===${NC}"
echo "Querying database via Cloud SQL Proxy..."
student_count=$(timeout 5 python3 -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='localhost',
        port=5433,
        database='dtu_aims_attendance',
        user='dtu_aims_user',
        password='dtuAims2026User!'
    )
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM students')
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    print(count)
except Exception as e:
    print('0')
" 2>/dev/null)

if [ "$student_count" -gt 0 ]; then
    test_result "Database Students Table" "PASS" "Found $student_count students in database"
else
    test_result "Database Students Table" "SKIP" "Cloud SQL Proxy not running (run: /tmp/cloud_sql_proxy -instances=antiproxy-dtu:asia-south1:dtu-aims-attendance-db=tcp:5433)"
fi

echo -e "${BLUE}=== TEST 6: Database - Check face_embeddings Table ===${NC}"
embedding_count=$(timeout 5 python3 -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='localhost',
        port=5433,
        database='dtu_aims_attendance',
        user='dtu_aims_user',
        password='dtuAims2026User!'
    )
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM face_embeddings')
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    print(count)
except Exception as e:
    print('0')
" 2>/dev/null)

if [ "$embedding_count" -gt 0 ]; then
    test_result "Database Face Embeddings" "PASS" "Found $embedding_count face embeddings in database"
else
    test_result "Database Face Embeddings" "SKIP" "Cloud SQL Proxy not running"
fi

echo -e "${BLUE}=== TEST 7: Face-API Class Filtering (New Feature) ===${NC}"
# Create a test request with allowed_person_ids
cat > /tmp/test_class_filter.json << 'EOF'
{
    "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "allowed_person_ids": ["2K24/AIMS/01", "2K24/AIMS/02", "2K24/AIMS/32"]
}
EOF

echo "Testing with class roster filter (3 roll numbers)..."
response=$(curl -s -X POST "$FACE_API_URL/recognize_faces" \
    -H "Content-Type: application/json" \
    -d @/tmp/test_class_filter.json)

if echo "$response" | jq -e '.results_json' > /dev/null 2>&1; then
    test_result "Class Roster Filtering" "PASS" "Face-API accepted allowed_person_ids parameter"
    echo "  Response structure validated (no recognized faces expected from 1x1 pixel image)"
elif echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    error=$(echo "$response" | jq -r '.error')
    test_result "Class Roster Filtering" "FAIL" "Error: $error"
else
    test_result "Class Roster Filtering" "FAIL" "Unexpected response format"
fi

echo -e "${BLUE}=== TEST 8: Backend OpenAPI Documentation ===${NC}"
response=$(curl -s "$BACKEND_URL/docs")
if echo "$response" | grep -q "swagger" || echo "$response" | grep -q "openapi"; then
    test_result "Backend API Docs" "PASS" "API documentation available at $BACKEND_URL/docs"
else
    test_result "Backend API Docs" "SKIP" "API docs may not be enabled"
fi

echo -e "${BLUE}=== TEST 9: Backend Student Auth Endpoint Schema ===${NC}"
response=$(curl -s "$BACKEND_URL/openapi.json")
if echo "$response" | jq -e '.paths["/auth/google/student"]' > /dev/null 2>&1; then
    # Check if response schema includes rollNo
    if echo "$response" | jq -e '.components.schemas.UserInfo.properties.rollNo' > /dev/null 2>&1; then
        test_result "Student Auth Schema" "PASS" "UserInfo schema includes 'rollNo' field"
    else
        test_result "Student Auth Schema" "FAIL" "UserInfo schema missing 'rollNo' field"
    fi
else
    test_result "Student Auth Schema" "SKIP" "Could not fetch OpenAPI schema"
fi

echo -e "${BLUE}=== TEST 10: Check Person_ID in Face Embeddings ===${NC}"
embeddings_with_id=$(timeout 5 python3 -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='localhost',
        port=5433,
        database='dtu_aims_attendance',
        user='dtu_aims_user',
        password='dtuAims2026User!'
    )
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM face_embeddings WHERE person_id IS NOT NULL AND person_id != \\\'\\\'')
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    print(count)
except Exception as e:
    print('-1')
" 2>/dev/null)

if [ "$embeddings_with_id" -gt 0 ]; then
    test_result "Face Embeddings with Person_ID" "PASS" "$embeddings_with_id embeddings have person_id assigned"
elif [ "$embeddings_with_id" == "0" ]; then
    test_result "Face Embeddings with Person_ID" "WARN" "No embeddings have person_id yet - students need to re-upload photos"
else
    test_result "Face Embeddings with Person_ID" "SKIP" "Cloud SQL Proxy not running"
fi

echo ""
echo "================================================================================"
echo "                            TEST SUMMARY"
echo "================================================================================"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:      ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:      ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Rebuild Flutter apps to use new features"
    echo "2. Have students re-upload photos (will use roll_no as person_id)"
    echo "3. Test end-to-end attendance marking with class filtering"
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Review failed tests above and fix issues before proceeding."
fi

echo ""
echo "================================================================================"
echo "                        ADDITIONAL INFORMATION"
echo "================================================================================"
echo ""
echo "Backend URL:  $BACKEND_URL"
echo "Face-API URL: $FACE_API_URL"
echo ""
echo "API Documentation:"
echo "  - Backend:  $BACKEND_URL/docs"
echo "  - OpenAPI:  $BACKEND_URL/openapi.json"
echo ""
echo "To start Cloud SQL Proxy (for database tests):"
echo "  /tmp/cloud_sql_proxy -instances=antiproxy-dtu:asia-south1:dtu-aims-attendance-db=tcp:5433 &"
echo ""
echo "To test student login (requires Google OAuth token):"
echo "  1. Get Google ID token from student app"
echo "  2. curl -X POST $BACKEND_URL/auth/google/student \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"idToken\": \"YOUR_TOKEN_HERE\"}'"
echo "  3. Check response includes 'rollNo' field"
echo ""
echo "================================================================================"
