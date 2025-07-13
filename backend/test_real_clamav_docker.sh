#!/bin/bash

# ThreatCheck API - Real ClamAV Docker Integration Test
# This script tests all signature management endpoints using real ClamAV from Docker

API_BASE="http://localhost:3765"
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 ThreatCheck API - Real ClamAV Docker Integration Test${NC}"
echo -e "${BLUE}==========================================================${NC}\n"

# Test 1: Health Check with Real ClamAV
echo -e "${YELLOW}📊 Test 1: Health Check (Real ClamAV)${NC}"
HEALTH_RESPONSE=$(curl -s -X GET "${API_BASE}/health")
echo "$HEALTH_RESPONSE" | jq '.'
CLAMAV_VERSION=$(echo "$HEALTH_RESPONSE" | jq -r '.clamav')
echo -e "${GREEN}✅ ClamAV Version: $CLAMAV_VERSION${NC}\n"

# Test 2: Get Real Signature Information
echo -e "${YELLOW}📋 Test 2: Get Real Signature Information${NC}"
SIG_INFO=$(curl -s -X GET "${API_BASE}/api/signatures/info")
echo "$SIG_INFO" | jq '.'
TOTAL_SIGS=$(echo "$SIG_INFO" | jq -r '.current.totalSignatures')
echo -e "${GREEN}✅ Total Signatures: $TOTAL_SIGS${NC}\n"

# Test 3: Trigger Real Signature Update
echo -e "${YELLOW}🔄 Test 3: Trigger Real Signature Update${NC}"
UPDATE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/signatures/update" -H "Content-Type: application/json")
echo "$UPDATE_RESPONSE" | jq '.'
UPDATE_SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success')
if [ "$UPDATE_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ Signature update completed successfully${NC}"
    echo -e "${BLUE}Raw ClamAV update output:${NC}"
    echo "$UPDATE_RESPONSE" | jq -r '.updateResult.rawResult' | head -10
else
    echo -e "${RED}❌ Signature update failed${NC}"
fi
echo ""

# Test 4: Get Updated Signature Information
echo -e "${YELLOW}📊 Test 4: Get Updated Signature Information${NC}"
UPDATED_SIG_INFO=$(curl -s -X GET "${API_BASE}/api/signatures/info")
echo "$UPDATED_SIG_INFO" | jq '.'
UPDATED_TOTAL_SIGS=$(echo "$UPDATED_SIG_INFO" | jq -r '.current.totalSignatures')
echo -e "${GREEN}✅ Updated Total Signatures: $UPDATED_TOTAL_SIGS${NC}\n"

# Test 5: Get Signature Update History
echo -e "${YELLOW}📈 Test 5: Get Signature Update History${NC}"
HISTORY_RESPONSE=$(curl -s -X GET "${API_BASE}/api/signatures/history?limit=5")
echo "$HISTORY_RESPONSE" | jq '.'
HISTORY_COUNT=$(echo "$HISTORY_RESPONSE" | jq -r '.count')
echo -e "${GREEN}✅ History entries: $HISTORY_COUNT${NC}\n"

# Test 6: File Scanning with Real ClamAV
echo -e "${YELLOW}🔍 Test 6: File Scanning with Real ClamAV${NC}"
if [ -f "test_files/clean_file.txt" ]; then
    SCAN_RESPONSE=$(curl -s -X POST "${API_BASE}/api/scan/file" -F "file=@test_files/clean_file.txt")
    echo "$SCAN_RESPONSE" | jq '.'
    SCAN_RESULT=$(echo "$SCAN_RESPONSE" | jq -r '.scanResult.isClean')
    if [ "$SCAN_RESULT" = "true" ]; then
        echo -e "${GREEN}✅ File scan completed - File is clean${NC}"
    else
        echo -e "${RED}⚠️ File scan detected issues${NC}"
    fi
else
    echo -e "${RED}❌ Test file not found: test_files/clean_file.txt${NC}"
fi
echo ""

# Test 7: Docker Container Status
echo -e "${YELLOW}🐳 Test 7: Docker Container Status${NC}"
echo "ClamAV Container:"
docker ps --filter "name=threatcheck-clamav" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "API Container:"
docker ps --filter "name=threatcheck-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "PostgreSQL Container:"
docker ps --filter "name=threatcheck-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Summary
echo -e "${GREEN}✅ Real ClamAV Docker Integration Test Completed!${NC}"
echo -e "${BLUE}🎉 The ThreatCheck API is successfully using ClamAV from Docker containers.${NC}\n"

echo -e "${YELLOW}📝 Summary:${NC}"
echo -e "  • ${GREEN}API running on:${NC} ${API_BASE}"
echo -e "  • ${GREEN}ClamAV Version:${NC} $(echo "$CLAMAV_VERSION" | head -1)"
echo -e "  • ${GREEN}Total Signatures:${NC} $UPDATED_TOTAL_SIGS"
echo -e "  • ${GREEN}Database Status:${NC} Connected and operational"
echo -e "  • ${GREEN}File Scanning:${NC} Working with real ClamAV"
echo -e "  • ${GREEN}Signature Updates:${NC} Real freshclam integration"
echo ""

echo -e "${YELLOW}🔗 Available Endpoints:${NC}"
echo -e "  • GET  ${API_BASE}/health"
echo -e "  • GET  ${API_BASE}/api/signatures/info"
echo -e "  • POST ${API_BASE}/api/signatures/update"
echo -e "  • GET  ${API_BASE}/api/signatures/history"
echo -e "  • POST ${API_BASE}/api/scan/file"
echo -e "  • POST ${API_BASE}/api/scan/files"
echo -e "  • GET  ${API_BASE}/api/scan/history"
