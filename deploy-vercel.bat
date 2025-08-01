@echo off
REM AT-ICT LMS Vercel Deployment Script for Windows
REM This script helps automate the deployment process

echo 🚀 AT-ICT LMS Vercel Deployment Script
echo ======================================

REM Check if we're in the right directory
if not exist "client\package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Navigate to client directory
cd client

echo 📦 Installing dependencies...
call npm install

echo 🔧 Building the application...
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
) else (
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo 🌐 Checking if Vercel CLI is installed...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Installing Vercel CLI...
    call npm install -g vercel
)

echo 🔐 Logging into Vercel...
call vercel login

echo 🚀 Deploying to Vercel...
echo Note: You'll be prompted to configure your project settings.
call vercel --prod

echo ✅ Deployment complete!
echo 📋 Next steps:
echo 1. Configure environment variables in Vercel dashboard
echo 2. Test your deployed application
echo 3. Set up custom domain (optional)
echo 4. Configure analytics (optional)

cd ..
pause 