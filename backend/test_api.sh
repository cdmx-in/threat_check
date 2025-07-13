#!/bin/bash

# ThreatCheck API Test Script

API_URL="http://localhost:3000"

echo "🔍 ThreatCheck API Test Script"
echo "================================"

# Check if API is running
echo "1. Health Check..."
curl -s "${API_URL}/health" | jq '.' || echo "❌ Health check failed - ensure the API is running"
echo ""

# Create test files
echo "2. Creating test files..."
mkdir -p test_files
echo "This is a clean test file." > test_files/clean_file.txt
echo "Hello World" > test_files/hello.txt
echo "Sample document content" > test_files/document.txt

# Test single file scan
echo "3. Testing single file scan..."
echo "Scanning: clean_file.txt"
curl -s -X POST -F "file=@test_files/clean_file.txt" "${API_URL}/api/scan/file" | jq '.'
echo ""

# Test multiple files scan
echo "4. Testing multiple files scan..."
echo "Scanning: hello.txt and document.txt"
curl -s -X POST -F "files=@test_files/hello.txt" -F "files=@test_files/document.txt" "${API_URL}/api/scan/files" | jq '.'
echo ""

# Test scan history
echo "5. Getting scan history..."
curl -s "${API_URL}/api/scan/history?limit=5" | jq '.'
echo ""

# Test error case - no file
echo "6. Testing error case (no file)..."
curl -s -X POST "${API_URL}/api/scan/file" | jq '.'
echo ""

# Clean up
echo "7. Cleaning up test files..."
rm -rf test_files

echo "✅ Test script completed!"
echo ""
echo "To test with your own files:"
echo "  curl -X POST -F \"file=@/path/to/your/file\" ${API_URL}/api/scan/file"
echo ""
echo "To view scan history:"
echo "  curl ${API_URL}/api/scan/history"
