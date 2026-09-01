@echo off
title Push Yoga License Portal to GitHub
color 0b
echo ========================================================
echo   Yoga Vision 27 - Auto GitHub Setup and Push
echo ========================================================
echo.

set /p GITHUB_URL="Paste your GitHub Repository URL (e.g. https://github.com/Username/repo.git): "

if "%GITHUB_URL%"=="" (
    echo [ERROR] No URL provided.
    pause
    exit /b
)

echo.
echo [1/4] Checking Git installation...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo Git is not installed on your PC yet!
    echo Opening the official 1-click Git installer for Windows...
    start https://git-scm.com/download/win
    echo.
    echo Please install Git, then double-click this script again.
    pause
    exit /b
)

echo [2/4] Initializing Git repository...
git init
git add .
git commit -m "Deploy Yoga Vision 27 License Server"

echo [3/4] Setting main branch...
git branch -M main

echo [4/4] Connecting to GitHub and pushing...
git remote remove origin 2>nul
git remote add origin %GITHUB_URL%
git push -u origin main --force

echo.
echo ========================================================
echo   SUCCESS! Your project has been pushed to GitHub.
echo   Now go to https://vercel.com and import this repo!
echo ========================================================
pause
