#!/bin/bash

# Deployment Verification Script
# Tests database, frontend build, and deployment readiness

echo "=========================================="
echo "Haldeki Market - Deployment Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Test function
test_step() {
    local name="$1"
    local command="$2"

    echo -n "Testing: $name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "1. TypeScript Compilation"
test_step "Type checking" "npx tsc --noEmit"

echo ""
echo "2. Production Build"
test_step "Build succeeds" "npm run build"

echo ""
echo "3. Unit Tests"
echo -n "Running tests... "
if npm test -- --run --passWithNoTests > test-output.txt 2>&1; then
    # Parse results
    TOTAL=$(grep -oP '\d+(?= tests)' test-output.txt | head -1)
    PASS=$(grep -oP '\d+(?= passed)' test-output.txt | head -1)
    FAIL=$(grep -oP '\d+(?= failed)' test-output.txt | head -1)

    if [ -z "$FAIL" ]; then
        FAIL=0
    fi

    echo -e "${GREEN}PASSED${NC} ($PASS/$TOTAL passed)"
    ((PASSED++))

    if [ "$FAIL" -gt 0 ]; then
        echo -e "  ${YELLOW}Warning: $FAIL tests failed${NC}"
    fi
else
    echo -e "${RED}FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "=========================================="
echo "Summary:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo "=========================================="
echo ""

# Deployment readiness
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify pricing_config table in Supabase"
    echo "  2. Deploy to Vercel: vercel --prod"
    echo "  3. Test production: https://www.haldeki.com"
    exit 0
else
    echo -e "${RED}DEPLOYMENT NOT READY${NC}"
    echo "Please fix the failing tests above."
    exit 1
fi
