@echo off
echo 🧪 Testing build process for Vercel deployment...

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist build rmdir /s /q build
if exist node_modules rmdir /s /q node_modules

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Test the build
echo 🔧 Testing build process...
set CI=false
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful! Your app is ready for Vercel deployment.
    echo 📋 Next steps:
    echo 1. Commit and push these changes to GitHub
    echo 2. Redeploy on Vercel
    echo 3. The build should now work correctly
) else (
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)

pause 