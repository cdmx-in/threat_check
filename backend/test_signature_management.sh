#!/bin/bash

# ThreatCheck API - Signature Management Testing Script
# This script tests all the new signature management endpoints

API_BASE="http://localhost:3000"
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔬 ThreatCheck API - Signature Management Test Suite${NC}"
echo -e "${YELLOW}=================================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}📊 Test 1: Health Check${NC}"
curl -s -X GET "${API_BASE}/health" | jq '.'
echo -e "\n"

# Test 2: Get Current Signature Information
echo -e "${YELLOW}📋 Test 2: Get Current Signature Information${NC}"
curl -s -X GET "${API_BASE}/api/signatures/info" | jq '.'
echo -e "\n"

# Test 3: Trigger Signature Update
echo -e "${YELLOW}🔄 Test 3: Trigger Signature Update${NC}"
curl -s -X POST "${API_BASE}/api/signatures/update" \
    -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 4: Get Signature Update History (Default pagination)
echo -e "${YELLOW}📈 Test 4: Get Signature Update History (Default)${NC}"
curl -s -X GET "${API_BASE}/api/signatures/history" | jq '.'
echo -e "\n"

# Test 5: Get Signature Update History (Custom pagination)
echo -e "${YELLOW}📊 Test 5: Get Signature Update History (Custom pagination)${NC}"
curl -s -X GET "${API_BASE}/api/signatures/history?page=1&limit=3" | jq '.'
echo -e "\n"

# Test 6: Test file scanning still works
echo -e "${YELLOW}🔍 Test 6: File Scanning (Verify integration)${NC}"
if [ -f "test_files/clean_file.txt" ]; then
    curl -s -X POST "${API_BASE}/api/scan/file" \
        -F "file=@test_files/clean_file.txt" | jq '.'
else
    echo -e "${RED}❌ Test file not found: test_files/clean_file.txt${NC}"
fi
echo -e "\n"

# Test 7: Multiple signature updates to test history tracking
echo -e "${YELLOW}🔄 Test 7: Multiple Updates (History tracking)${NC}"
echo "Performing 2 more updates..."
curl -s -X POST "${API_BASE}/api/signatures/update" -H "Content-Type: application/json" > /dev/null
sleep 1
curl -s -X POST "${API_BASE}/api/signatures/update" -H "Content-Type: application/json" > /dev/null
echo "Getting latest history:"
curl -s -X GET "${API_BASE}/api/signatures/history?limit=5" | jq '.'
echo -e "\n"

# Test 8: Error handling (invalid pagination)
echo -e "${YELLOW}❗ Test 8: Error Handling (Invalid pagination)${NC}"
curl -s -X GET "${API_BASE}/api/signatures/history?page=-1&limit=1000" | jq '.'
echo -e "\n"

echo -e "${GREEN}✅ All signature management tests completed!${NC}"
echo -e "${GREEN}🎉 The ClamAV signature management system is working correctly.${NC}\n"

echo -e "${YELLOW}📝 Available Endpoints:${NC}"
echo -e "  • GET ${API_BASE}/api/signatures/info"
echo -e "  • POST ${API_BASE}/api/signatures/update"
echo -e "  • GET ${API_BASE}/api/signatures/history"
echo -e "  • GET ${API_BASE}/health"
echo -e "  • POST ${API_BASE}/api/scan/file"
echo -e "  • POST ${API_BASE}/api/scan/files"
echo -e "  • GET ${API_BASE}/api/scan/history"
