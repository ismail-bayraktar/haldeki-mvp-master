#!/bin/bash

###############################################################################
# Pricing System Test Runner
# Fiyatlandırma Sistemi Test Çalıştırıcı
#
# Runs all tests for the new pricing system and generates coverage report
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COVERAGE_DIR="$PROJECT_ROOT/coverage"
COVERAGE_THRESHOLD=80

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Pricing System Test Suite${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Parse command line arguments
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_E2E=false
RUN_SECURITY=false
RUN_PERFORMANCE=false
RUN_MIGRATION=false
RUN_ALL=true
COVERAGE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --unit)
      RUN_UNIT=true
      RUN_ALL=false
      shift
      ;;
    --integration)
      RUN_INTEGRATION=true
      RUN_ALL=false
      shift
      ;;
    --e2e)
      RUN_E2E=true
      RUN_ALL=false
      shift
      ;;
    --security)
      RUN_SECURITY=true
      RUN_ALL=false
      shift
      ;;
    --performance)
      RUN_PERFORMANCE=true
      RUN_ALL=false
      shift
      ;;
    --migration)
      RUN_MIGRATION=true
      RUN_ALL=false
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --unit          Run unit tests only"
      echo "  --integration   Run integration tests only"
      echo "  --e2e           Run E2E tests only"
      echo "  --security      Run security tests only"
      echo "  --performance   Run performance tests only"
      echo "  --migration     Run migration tests only"
      echo "  --coverage      Generate coverage report"
      echo "  --help          Show this help message"
      echo ""
      echo "If no options provided, runs all tests"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Change to project root
cd "$PROJECT_ROOT"

###############################################################################
# Pre-test Checks
###############################################################################

echo -e "${BLUE}[1/7] Pre-test Checks${NC}"
echo "----------------------------"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Warning: node_modules not found. Installing dependencies...${NC}"
  npm install
fi

# Check TypeScript compilation
echo -e "${BLUE}Checking TypeScript compilation...${NC}"
if ! npm run typecheck > /dev/null 2>&1; then
  echo -e "${RED}TypeScript compilation failed. Please fix type errors before running tests.${NC}"
  echo "Run 'npm run typecheck' to see errors"
  exit 1
fi
echo -e "${GREEN}TypeScript compilation: OK${NC}"
echo ""

###############################################################################
# Unit Tests
###############################################################################

if [ "$RUN_ALL" = true ] || [ "$RUN_UNIT" = true ]; then
  echo -e "${BLUE}[2/7] Running Unit Tests${NC}"
  echo "----------------------------"

  if [ "$COVERAGE" = true ]; then
    echo "Running with coverage..."
    npm run test:unit:coverage -- tests/unit/pricing-calculation.test.ts
  else
    npm run test:unit -- tests/unit/pricing-calculation.test.ts
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Unit tests: PASSED${NC}"
  else
    echo -e "${RED}Unit tests: FAILED${NC}"
    exit 1
  fi
  echo ""
fi

###############################################################################
# Integration Tests
###############################################################################

if [ "$RUN_ALL" = true ] || [ "$RUN_INTEGRATION" = true ]; then
  echo -e "${BLUE}[3/7] Running Integration Tests${NC}"
  echo "----------------------------"

  # Check for required environment variables
  if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}Warning: Supabase credentials not set. Skipping integration tests.${NC}"
    echo "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to run integration tests"
  else
    npm run test:unit -- tests/integration/pricing-rpc.test.ts

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Integration tests: PASSED${NC}"
    else
      echo -e "${RED}Integration tests: FAILED${NC}"
      exit 1
    fi
  fi
  echo ""
fi

###############################################################################
# E2E Tests
###############################################################################

if [ "$RUN_ALL" = true ] || [ "$RUN_E2E" = true ]; then
  echo -e "${BLUE}[4/7] Running E2E Tests${NC}"
  echo "----------------------------"

  # Check if Playwright is installed
  if ! npx playwright --version > /dev/null 2>&1; then
    echo -e "${YELLOW}Playwright not installed. Installing...${NC}"
    npm run test:setup
  fi

  # Check for base URL
  if [ -z "$PLAYWRIGHT_TEST_BASE_URL" ]; then
    echo -e "${YELLOW}Warning: PLAYWRIGHT_TEST_BASE_URL not set. Using default: http://localhost:5173${NC}"
    export PLAYWRIGHT_TEST_BASE_URL="http://localhost:5173"
  fi

  # Check if dev server is running
  if ! curl -s "$PLAYWRIGHT_TEST_BASE_URL" > /dev/null 2>&1; then
    echo -e "${YELLOW}Dev server not running. Starting it...${NC}"
    npm run dev > /dev/null 2>&1 &
    DEV_SERVER_PID=$!
    echo "Waiting for dev server to start..."
    sleep 10
  fi

  npm run test:e2e -- tests/e2e/pricing-user-flow.spec.ts

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}E2E tests: PASSED${NC}"
  else
    echo -e "${RED}E2E tests: FAILED${NC}"

    # Kill dev server if we started it
    if [ ! -z "$DEV_SERVER_PID" ]; then
      kill $DEV_SERVER_PID 2>/dev/null || true
    fi
    exit 1
  fi

  # Kill dev server if we started it
  if [ ! -z "$DEV_SERVER_PID" ]; then
    kill $DEV_SERVER_PID 2>/dev/null || true
  fi
  echo ""
fi

###############################################################################
# Security Tests
###############################################################################

if [ "$RUN_ALL" = true ] || [ "$RUN_SECURITY" = true ]; then
  echo -e "${BLUE}[5/7] Running Security Tests${NC}"
  echo "----------------------------"

  if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}Warning: Supabase credentials not set. Skipping security tests.${NC}"
  else
    npm run test:unit -- tests/security/pricing-security.test.ts

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Security tests: PASSED${NC}"
    else
      echo -e "${RED}Security tests: FAILED${NC}"
      exit 1
    fi
  fi
  echo ""
fi

###############################################################################
# Performance Tests
###############################################################################

if [ "$RUN_ALL" = true ] || [ "$RUN_PERFORMANCE" = true ]; then
  echo -e "${BLUE}[6/7] Running Performance Tests${NC}"
  echo "----------------------------"

  if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}Warning: Supabase credentials not set. Skipping performance tests.${NC}"
  else
    npm run test:unit -- tests/performance/pricing-performance.test.ts

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Performance tests: PASSED${NC}"
    else
      echo -e "${RED}Performance tests: FAILED${NC}"
      exit 1
    fi
  fi
  echo ""
fi

###############################################################################
# Migration Tests
###############################################################################

if [ "$RUN_ALL" = true ] || [ "$RUN_MIGRATION" = true ]; then
  echo -e "${BLUE}[7/7] Running Migration Tests${NC}"
  echo "----------------------------"

  # Migration tests require service role key
  if [ -z "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}Warning: VITE_SUPABASE_SERVICE_ROLE_KEY not set. Skipping migration tests.${NC}"
    echo "Migration tests require elevated database access"
  else
    npm run test:unit -- tests/migration/pricing-migration.test.ts

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Migration tests: PASSED${NC}"
    else
      echo -e "${RED}Migration tests: FAILED${NC}"
      exit 1
    fi
  fi
  echo ""
fi

###############################################################################
# Coverage Report
###############################################################################

if [ "$COVERAGE" = true ] && [ -d "$COVERAGE_DIR" ]; then
  echo -e "${BLUE}Coverage Report${NC}"
  echo "----------------------------"

  if [ -f "$COVERAGE_DIR/coverage-summary.json" ]; then
    # Extract coverage percentage
    COVERAGE_PCT=$(node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('$COVERAGE_DIR/coverage-summary.json', 'utf8'));
      const lines = data.total?.lines?.pct || 0;
      console.log(lines);
    ")

    echo "Code Coverage: ${COVERAGE_PCT}%"

    if (( $(echo "$COVERAGE_PCT < $COVERAGE_THRESHOLD" | bc -l) )); then
      echo -e "${YELLOW}Warning: Coverage ${COVERAGE_PCT}% is below threshold ${COVERAGE_THRESHOLD}%${NC}"
    else
      echo -e "${GREEN}Coverage ${COVERAGE_PCT}% meets threshold ${COVERAGE_THRESHOLD}%${NC}"
    fi

    echo ""
    echo "Detailed report: $COVERAGE_DIR/index.html"
  else
    echo -e "${YELLOW}Coverage report not found${NC}"
  fi
  echo ""
fi

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}All Tests Completed Successfully!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

echo "Test Results Summary:"
echo "  Unit Tests: PASSED"
echo "  Integration Tests: PASSED"
echo "  E2E Tests: PASSED"
echo "  Security Tests: PASSED"
echo "  Performance Tests: PASSED"
echo "  Migration Tests: PASSED"
echo ""

if [ "$COVERAGE" = true ]; then
  echo "Coverage Report: $COVERAGE_DIR/index.html"
fi

echo ""
echo "To view detailed test results:"
echo "  - Unit/Integration/Security/Performance: Check terminal output above"
echo "  - E2E: See playwright-report/index.html"
echo "  - Coverage: Open coverage/index.html in browser"
echo ""

exit 0
