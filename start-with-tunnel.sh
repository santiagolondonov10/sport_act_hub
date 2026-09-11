#!/bin/bash

# Script to build frontend and start both backend and frontend together
# This allows access through a tunnel

echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Frontend build failed"
  exit 1
fi

echo "✅ Frontend built successfully"
echo ""
echo "🚀 Starting backend server..."
echo "   Backend will serve both API and frontend from localhost:3001"
echo "   Access locally at: http://localhost:3001"
echo "   Access via tunnel at: https://w3fszsbv-5173.use2.devtunnels.ms/"
echo ""

cd server
npm start
