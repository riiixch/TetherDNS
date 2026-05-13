@echo off
setlocal enabledelayedexpansion

:: --- ส่วนการตั้งค่า Default ---
set DEFAULT_REGISTRY=docker-private.riiixch.com
set DEFAULT_IMAGE_NAME=tetherdns
set DEFAULT_TAG=latest

echo ========================================
echo   Docker Build Assistant (Local/Push)
echo ========================================

:: 1. เลือกโหมดการทำงาน
echo Select Mode:
echo [1] Build Local Only
echo [2] Build and Push to Registry
set /p MODE="Choose mode (1 or 2) [2]: "
if "%MODE%"=="" set MODE=2

:: 2. รับค่าชื่อ Image
set /p IMAGE_NAME="Enter Image Name [%DEFAULT_IMAGE_NAME%]: "
if "%IMAGE_NAME%"=="" set IMAGE_NAME=%DEFAULT_IMAGE_NAME%

:: 3. รับค่า Tag
set /p IMG_TAG="Enter Tag [%DEFAULT_TAG%]: "
if "%IMG_TAG%"=="" set IMG_TAG=%DEFAULT_TAG%

:: 4. รับค่า Registry (เฉพาะถ้าเลือก mode 2)
if "%MODE%"=="2" (
    set /p REGISTRY="Enter Registry URL [%DEFAULT_REGISTRY%]: "
    if "!REGISTRY!"=="" set REGISTRY=%DEFAULT_REGISTRY%
    set FULL_IMAGE_PATH=!REGISTRY!/%IMAGE_NAME%:%IMG_TAG%
)

echo.
echo ----------------------------------------
echo SUMMARY:
if "%MODE%"=="1" (
    echo Mode:       BUILD LOCAL ONLY
) else (
    echo Mode:       BUILD ^& PUSH
    echo Registry:   %REGISTRY%
)
echo Image Name: %IMAGE_NAME%
echo Tag:        %IMG_TAG%
if "%MODE%"=="2" echo Full Path:  %FULL_IMAGE_PATH%
echo ----------------------------------------
echo.

:: ถามเพื่อยืนยันก่อนเริ่ม
set /p CONFIRM="Confirm to proceed? (y/n): "
if /i "%CONFIRM%" NEQ "y" (
    echo [Cancelled] Exiting...
    pause
    exit /b
)

:: --- เริ่มขั้นตอน Docker Build ---
echo.
echo [+] Building image: %IMAGE_NAME%:%IMG_TAG%...
docker build -t %IMAGE_NAME%:%IMG_TAG% .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] ERROR: Build failed!
    pause
    exit /b
)

:: --- เริ่มขั้นตอน Push (เฉพาะถ้าเลือก mode 2) ---
if "%MODE%"=="2" (
    echo.
    echo [+] Tagging for Registry...
    docker tag %IMAGE_NAME%:%IMG_TAG% %FULL_IMAGE_PATH%
    
    echo [+] Pushing to Registry: %FULL_IMAGE_PATH%...
    docker push %FULL_IMAGE_PATH%
    
    if !ERRORLEVEL! EQU 0 (
        echo.
        echo ========================================
        echo   SUCCESS: Image pushed to Registry!
        echo ========================================
    ) else (
        echo.
        echo [!] ERROR: Push failed! Check your login or network.
    )
) else (
    echo.
    echo ========================================
    echo   SUCCESS: Local Build Finished!
    echo ========================================
)

pause