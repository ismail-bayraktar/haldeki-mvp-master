#!/bin/bash

# Security Test Suite for optimize-image Edge Function
# Usage: ./scripts/run-security-tests.sh <VALID_JWT_TOKEN>

set -e

# Configuration
FUNCTION_URL="https://ynatuiwdvkxcmmnmejkl.supabase.co/functions/v1/optimize-image"
VALID_TOKEN="${1:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"

    if [ "$expected_status" == "$actual_status" ]; then
        echo -e "${GREEN}[PASS]${NC} $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}[FAIL]${NC} $test_name (Expected: $expected_status, Got: $actual_status)"
        ((TESTS_FAILED++))
    fi
}

# Function to run test and capture status
run_test() {
    local test_name="$1"
    local expected_status="$2"
    shift 2
    local curl_output=$(curl -s -w "\n%{http_code}" "$@")
    local actual_status=$(echo "$curl_output" | tail -n1)
    local body=$(echo "$curl_output" | sed '$d')

    echo -e "\n${YELLOW}Test:${NC} $test_name"
    echo "Request: $@"
    echo -e "Response:\n$body"
    print_result "$test_name" "$expected_status" "$actual_status"
}

echo "===================================="
echo "SECURITY TEST SUITE"
echo "Edge Function: optimize-image"
echo "===================================="

# Check if token is provided for authenticated tests
if [ -z "$VALID_TOKEN" ]; then
    echo -e "${YELLOW}Warning:${NC} No JWT token provided. Authenticated tests will be skipped."
    echo -e "${YELLOW}Usage:${NC} ./scripts/run-security-tests.sh <YOUR_JWT_TOKEN>"
    SKIP_AUTH_TESTS=true
else
    echo -e "${GREEN}JWT token provided. Running all tests.${NC}"
    SKIP_AUTH_TESTS=false
fi

# Test 1: No Authorization Header
run_test "Test 1.1: No Authorization Header" \
    "401" \
    -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d '{"bucketId": "product-images", "path": "test.jpg"}'

# Test 2: Empty Authorization Header
run_test "Test 1.2: Empty Authorization Header" \
    "401" \
    -X POST "$FUNCTION_URL" \
    -H "Authorization: " \
    -H "Content-Type: application/json" \
    -d '{"bucketId": "product-images", "path": "test.jpg"}'

# Test 3: Invalid Token
run_test "Test 1.3: Invalid/Fake Token" \
    "401" \
    -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer invalid-token-12345" \
    -H "Content-Type: application/json" \
    -d '{"bucketId": "product-images", "path": "test.jpg"}'

# Test 4: Malformed Authorization Header (missing Bearer)
run_test "Test 1.4: Malformed Authorization Header" \
    "401" \
    -X POST "$FUNCTION_URL" \
    -H "Authorization: invalid-token-12345" \
    -H "Content-Type: application/json" \
    -d '{"bucketId": "product-images", "path": "test.jpg"}'

# Test 5: Wrong HTTP Method (GET)
run_test "Test 4.3: Wrong HTTP Method (GET)" \
    "405" \
    -X GET "$FUNCTION_URL"

# Test 6: Wrong HTTP Method (PUT)
run_test "Test 4.3: Wrong HTTP Method (PUT)" \
    "405" \
    -X PUT "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d '{"bucketId": "product-images", "path": "test.jpg"}'

# Test 7: Wrong HTTP Method (DELETE)
run_test "Test 4.3: Wrong HTTP Method (DELETE)" \
    "405" \
    -X DELETE "$FUNCTION_URL"

# Authenticated tests (require valid token)
if [ "$SKIP_AUTH_TESTS" = false ]; then

    # Test 8: Missing required parameters
    run_test "Test 4.1: Missing Parameters (empty body)" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}'

    # Test 9: Missing bucketId
    run_test "Test 4.1: Missing bucketId" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"path": "test.jpg"}'

    # Test 10: Missing path
    run_test "Test 4.1: Missing path" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "product-images"}'

    # Test 11: Invalid bucketId
    run_test "Test 4.2: Invalid bucketId" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "other-bucket", "path": "test.jpg"}'

    # Test 12: Path traversal attack (../)
    run_test "Test 2.1: Path Traversal Attack (../)" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "product-images", "path": "../../../etc/passwd"}'

    # Test 13: Path traversal with double encoding
    run_test "Test 2.2: Path Traversal (double-dot variant)" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "product-images", "path": "....//....//etc/passwd"}'

    # Test 14: Absolute path attempt
    run_test "Test 2.3: Absolute Path Attempt" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "product-images", "path": "/etc/passwd"}'

    # Test 15: Null byte injection
    run_test "Test 2.4: Null Byte Injection" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "product-images", "path": "test.jpg%00.png"}'

    # Test 16: Invalid characters in path
    run_test "Test 2.5: Invalid Characters in Path" \
        "400" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "product-images", "path": "test@#$%.jpg"}'

    # Test 17: Valid request (should succeed or fail gracefully if file doesn't exist)
    run_test "Test 7.1: Valid Request Structure" \
        "200" \
        -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer $VALID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"bucketId": "product-images", "path": "products/test.jpg"}'

else
    echo -e "\n${YELLOW}Skipping authenticated tests (no token provided)${NC}"
    echo "Authenticated tests:"
    echo "  - Missing required parameters"
    echo "  - Invalid bucketId"
    echo "  - Path traversal attacks"
    echo "  - Null byte injection"
    echo "  - Valid request"
fi

# Summary
echo ""
echo "===================================="
echo "TEST SUMMARY"
echo "===================================="
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "===================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
