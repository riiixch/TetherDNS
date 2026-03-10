@echo off
title Build TetherDNS Docker Image

:: กำหนดชื่อ Image และ Tag
set IMAGE_NAME=tetherdns
set TAG=latest

echo =======================================================
echo  Starting Docker Build for %IMAGE_NAME%:%TAG%
echo =======================================================
echo.

:: เริ่มทำการ Build Image
docker build -t %IMAGE_NAME%:%TAG% .

echo.
:: เช็คว่า Build ผ่านหรือไม่
if %errorlevel% neq 0 (
    echo [ERROR] Docker build failed! Please check the logs above.
) else (
    echo [SUCCESS] Docker image '%IMAGE_NAME%:%TAG%' built successfully!
    echo.
    echo -------------------------------------------------------
    echo  To run the container, use the following command:
    echo  docker run -d -p 3000:3000 --env-file .env --name tetherdns %IMAGE_NAME%:%TAG%
    echo -------------------------------------------------------
)

echo.
:: หยุดหน้าจอค้างไว้ให้ดูผลลัพธ์ (กดปุ่มอะไรก็ได้เพื่อปิด)
pause