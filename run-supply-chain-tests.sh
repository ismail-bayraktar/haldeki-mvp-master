#!/bin/bash

# Supply Chain E2E Test Execution Script
# Tests Supplier + Warehouse workflows

set -e

echo "================================"
echo "Supply Chain E2E Test Suite"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="F:/donusum/haldeki-love/haldeki-market"
SUPPLIER_TEST="tests/e2e/supplier/supplier-workflow.spec.ts"
WAREHOUSE_TEST="tests/e2e/warehouse/warehouse-workflow.spec.ts"
REPORT_DIR="test-results"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    print_error "Playwright not found. Installing..."
    npm install -D @playwright/test
    npx playwright install
fi

# Create report directory
mkdir -p "$REPORT_DIR"

# Test menu
echo "Select test suite to run:"
echo "1) Supplier Workflow Tests (126 tests)"
echo "2) Warehouse Workflow Tests (180 tests)"
echo "3) All Supply Chain Tests (306 tests)"
echo "4) Security Tests Only"
echo "5) Critical Path Tests"
echo "6) List All Tests"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        print_status "Running Supplier Workflow Tests..."
        echo ""
        npx playwright test "$SUPPLIER_TEST" --reporter=html,list
        ;;
    2)
        echo ""
        print_status "Running Warehouse Workflow Tests..."
        echo ""
        npx playwright test "$WAREHOUSE_TEST" --reporter=html,list
        ;;
    3)
        echo ""
        print_status "Running All Supply Chain Tests..."
        echo ""
        npx playwright test "$SUPPLIER_TEST" "$WAREHOUSE_TEST" --reporter=html,list
        ;;
    4)
        echo ""
        print_status "Running Security Tests..."
        echo ""
        npx playwright test "$SUPPLIER_TEST" "$WAREHOUSE_TEST" --grep "Access Control" --reporter=list
        ;;
    5)
        echo ""
        print_status "Running Critical Path Tests..."
        echo ""
        echo "Supplier: Login + Product CRUD + Import/Export"
        npx playwright test "$SUPPLIER_TEST" --grep "Authentication|Product Management|Import/Export" --reporter=list
        echo ""
        echo "Warehouse: Login + Picking + Fulfillment"
        npx playwright test "$WAREHOUSE_TEST" --grep "Authentication|Picking|Fulfillment" --reporter=list
        ;;
    6)
        echo ""
        print_status "Listing All Tests..."
        echo ""
        echo "=== SUPPLIER TESTS ==="
        npx playwright test "$SUPPLIER_TEST" --list
        echo ""
        echo "=== WAREHOUSE TESTS ==="
        npx playwright test "$WAREHOUSE_TEST" --list
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    print_status "All tests passed!"
    echo ""
    echo "View HTML report:"
    echo "  file://$PROJECT_DIR/$REPORT_DIR/index.html"
else
    echo ""
    print_error "Some tests failed. Check the report above."
    exit 1
fi
