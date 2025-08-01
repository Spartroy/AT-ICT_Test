#!/bin/bash

echo "🧪 Testing build process for Vercel deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test the build
echo "🔧 Testing build process..."
CI=false npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Your app is ready for Vercel deployment."
    echo "📋 Next steps:"
    echo "1. Commit and push these changes to GitHub"
    echo "2. Redeploy on Vercel"
    echo "3. The build should now work correctly"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi 