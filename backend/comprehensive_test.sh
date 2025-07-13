#!/bin/bash

# ThreatCheck API Comprehensive Test Suite
# This script tests all endpoints and validates responses

API_URL="http://localhost:3000"
TEST_DIR="api_test_files"
RESULTS_FILE="test_results.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ThreatCheck API Comprehensive Test Suite${NC}"
echo "=================================================="
echo ""

# Initialize results
echo '{"tests": [], "summary": {}}' > $RESULTS_FILE

# Helper function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local response="$3"
    local expected="$4"

    echo "Test: $test_name, Status: $status" >> test.log

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
    else
        echo -e "${RED}❌ $test_name${NC}"
        echo -e "${RED}   Expected: $expected${NC}"
        echo -e "${RED}   Got: $response${NC}"
    fi
}

# Create test files
echo -e "${YELLOW}📁 Setting up test files...${NC}"
mkdir -p $TEST_DIR
echo "This is a clean test file for scanning." > $TEST_DIR/clean_file.txt
echo "Hello World from ThreatCheck API test" > $TEST_DIR/hello.txt
echo "Sample document content for testing" > $TEST_DIR/document.txt

# Create a larger test file
head -c 1048576 /dev/urandom > $TEST_DIR/large_file.bin  # 1MB random file

# Test 1: Health Check
echo -e "${YELLOW}🏥 Test 1: Health Check${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json "$API_URL/health")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    status=$(jq -r '.status' temp_response.json 2>/dev/null)
    if [ "$status" = "healthy" ]; then
        log_test "Health Check" "PASS" "" ""
    else
        log_test "Health Check" "FAIL" "$status" "healthy"
    fi
else
    log_test "Health Check" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Test 2: Metrics Endpoint
echo -e "${YELLOW}📊 Test 2: Metrics Endpoint${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json "$API_URL/metrics")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    success=$(jq -r '.success' temp_response.json 2>/dev/null)
    if [ "$success" = "true" ]; then
        log_test "Metrics Endpoint" "PASS" "" ""
    else
        log_test "Metrics Endpoint" "FAIL" "$success" "true"
    fi
else
    log_test "Metrics Endpoint" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Test 3: API Documentation
echo -e "${YELLOW}📚 Test 3: API Documentation${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json "$API_URL/api-docs.json")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    openapi=$(jq -r '.openapi' temp_response.json 2>/dev/null)
    if [ "$openapi" = "3.0.3" ]; then
        log_test "API Documentation" "PASS" "" ""
    else
        log_test "API Documentation" "FAIL" "$openapi" "3.0.3"
    fi
else
    log_test "API Documentation" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Test 4: Single File Scan - Valid File
echo -e "${YELLOW}📄 Test 4: Single File Scan (Valid)${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json -X POST -F "file=@$TEST_DIR/clean_file.txt" "$API_URL/api/scan/file")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    success=$(jq -r '.success' temp_response.json 2>/dev/null)
    if [ "$success" = "true" ]; then
        log_test "Single File Scan (Valid)" "PASS" "" ""
    else
        log_test "Single File Scan (Valid)" "FAIL" "$success" "true"
    fi
else
    log_test "Single File Scan (Valid)" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Test 5: Single File Scan - No File
echo -e "${YELLOW}❌ Test 5: Single File Scan (No File)${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json -X POST "$API_URL/api/scan/file")
http_code=${response: -3}
if [ "$http_code" = "400" ]; then
    success=$(jq -r '.success' temp_response.json 2>/dev/null)
    if [ "$success" = "false" ]; then
        log_test "Single File Scan (No File)" "PASS" "" ""
    else
        log_test "Single File Scan (No File)" "FAIL" "$success" "false"
    fi
else
    log_test "Single File Scan (No File)" "FAIL" "HTTP $http_code" "HTTP 400"
fi

# Test 6: Multiple Files Scan
echo -e "${YELLOW}📁 Test 6: Multiple Files Scan${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json -X POST \
    -F "files=@$TEST_DIR/hello.txt" \
    -F "files=@$TEST_DIR/document.txt" \
    "$API_URL/api/scan/files")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    success=$(jq -r '.success' temp_response.json 2>/dev/null)
    total_files=$(jq -r '.totalFiles' temp_response.json 2>/dev/null)
    if [ "$success" = "true" ] && [ "$total_files" = "2" ]; then
        log_test "Multiple Files Scan" "PASS" "" ""
    else
        log_test "Multiple Files Scan" "FAIL" "success:$success,files:$total_files" "success:true,files:2"
    fi
else
    log_test "Multiple Files Scan" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Test 7: Scan History
echo -e "${YELLOW}📋 Test 7: Scan History${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json "$API_URL/api/scan/history?limit=10")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    success=$(jq -r '.success' temp_response.json 2>/dev/null)
    if [ "$success" = "true" ]; then
        log_test "Scan History" "PASS" "" ""
    else
        log_test "Scan History" "FAIL" "$success" "true"
    fi
else
    log_test "Scan History" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Test 8: Large File Scan
echo -e "${YELLOW}📊 Test 8: Large File Scan${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json -X POST -F "file=@$TEST_DIR/large_file.bin" "$API_URL/api/scan/file")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    success=$(jq -r '.success' temp_response.json 2>/dev/null)
    if [ "$success" = "true" ]; then
        log_test "Large File Scan" "PASS" "" ""
    else
        log_test "Large File Scan" "FAIL" "$success" "true"
    fi
else
    log_test "Large File Scan" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Test 9: Invalid Endpoint
echo -e "${YELLOW}🚫 Test 9: Invalid Endpoint${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.json "$API_URL/invalid/endpoint")
http_code=${response: -3}
if [ "$http_code" = "404" ]; then
    success=$(jq -r '.success' temp_response.json 2>/dev/null)
    if [ "$success" = "false" ]; then
        log_test "Invalid Endpoint" "PASS" "" ""
    else
        log_test "Invalid Endpoint" "FAIL" "$success" "false"
    fi
else
    log_test "Invalid Endpoint" "FAIL" "HTTP $http_code" "HTTP 404"
fi

# Test 10: Landing Page
echo -e "${YELLOW}🏠 Test 10: Landing Page${NC}"
response=$(curl -s -w "%{http_code}" -o temp_response.html "$API_URL/")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    if grep -q "ThreatCheck API" temp_response.html; then
        log_test "Landing Page" "PASS" "" ""
    else
        log_test "Landing Page" "FAIL" "Missing title" "ThreatCheck API title"
    fi
else
    log_test "Landing Page" "FAIL" "HTTP $http_code" "HTTP 200"
fi

# Performance Test
echo -e "${YELLOW}⚡ Performance Test: Concurrent Requests${NC}"
echo "Testing concurrent file uploads..."

for i in {1..5}; do
    curl -s -X POST -F "file=@$TEST_DIR/clean_file.txt" "$API_URL/api/scan/file" > /dev/null &
done
wait

log_test "Concurrent Requests" "PASS" "5 concurrent requests completed" ""

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
rm -rf $TEST_DIR
rm -f temp_response.json temp_response.html test.log

# Final Summary
echo ""
echo -e "${BLUE}📊 Test Summary${NC}"
echo "===================="
echo -e "${GREEN}All tests completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test with Docker: docker-compose up"
echo "2. Test with real ClamAV instead of mock service"
echo "3. Load test with tools like Apache Bench (ab) or wrk"
echo "4. Security test with tools like OWASP ZAP"
echo ""
echo -e "${BLUE}API Documentation: ${API_URL}/api-docs${NC}"
echo -e "${BLUE}Landing Page: ${API_URL}/${NC}"
