#!/bin/bash

# AT-ICT LMS Vercel Deployment Script
# This script helps automate the deployment process

echo "🚀 AT-ICT LMS Vercel Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to client directory
cd client

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

echo "🌐 Checking if Vercel CLI is installed..."
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Logging into Vercel..."
vercel login

echo "🚀 Deploying to Vercel..."
echo "Note: You'll be prompted to configure your project settings."
vercel --prod

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Test your deployed application"
echo "3. Set up custom domain (optional)"
echo "4. Configure analytics (optional)"

cd .. 