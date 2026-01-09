@echo off
REM Supply Chain E2E Test Execution Script for Windows
REM Tests Supplier + Warehouse workflows

setlocal enabledelayedexpansion

echo ========================================
echo Supply Chain E2E Test Suite
echo ========================================
echo.

REM Configuration
set PROJECT_DIR=F:\donusum\haldeki-love\haldeki-market
set SUPPLIER_TEST=tests/e2e/supplier/supplier-workflow.spec.ts
set WAREHOUSE_TEST=tests/e2e/warehouse/warehouse-workflow.spec.ts

REM Change to project directory
cd /d "%PROJECT_DIR%" || exit /b 1

REM Test menu
echo Select test suite to run:
echo 1) Supplier Workflow Tests (126 tests)
echo 2) Warehouse Workflow Tests (180 tests)
echo 3) All Supply Chain Tests (306 tests)
echo 4) Security Tests Only
echo 5) Critical Path Tests
echo 6) List All Tests
echo.

set /p choice="Enter choice [1-6]: "

if "%choice%"=="1" (
    echo.
    echo Running Supplier Workflow Tests...
    echo.
    npx playwright test "%SUPPLIER_TEST%" --reporter=html,list
) else if "%choice%"=="2" (
    echo.
    echo Running Warehouse Workflow Tests...
    echo.
    npx playwright test "%WAREHOUSE_TEST%" --reporter=html,list
) else if "%choice%"=="3" (
    echo.
    echo Running All Supply Chain Tests...
    echo.
    npx playwright test "%SUPPLIER_TEST%" "%WAREHOUSE_TEST%" --reporter=html,list
) else if "%choice%"=="4" (
    echo.
    echo Running Security Tests...
    echo.
    npx playwright test "%SUPPLIER_TEST%" "%WAREHOUSE_TEST%" --grep "Access Control" --reporter=list
) else if "%choice%"=="5" (
    echo.
    echo Running Critical Path Tests...
    echo.
    echo Supplier: Login + Product CRUD + Import/Export
    npx playwright test "%SUPPLIER_TEST%" --grep "Authentication|Product Management|Import/Export" --reporter=list
    echo.
    echo Warehouse: Login + Picking + Fulfillment
    npx playwright test "%WAREHOUSE_TEST%" --grep "Authentication|Picking|Fulfillment" --reporter=list
) else if "%choice%"=="6" (
    echo.
    echo Listing All Tests...
    echo.
    echo === SUPPLIER TESTS ===
    npx playwright test "%SUPPLIER_TEST%" --list
    echo.
    echo === WAREHOUSE TESTS ===
    npx playwright test "%WAREHOUSE_TEST%" --list
    exit /b 0
) else (
    echo Invalid choice
    exit /b 1
)

REM Check if tests passed
if %ERRORLEVEL% EQU 0 (
    echo.
    echo All tests passed!
    echo.
    echo View HTML report:
    echo   file:///%PROJECT_DIR%/playwright-report/index.html
) else (
    echo.
    echo Some tests failed. Check the report above.
    exit /b 1
)

endlocal
