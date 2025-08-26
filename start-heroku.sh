#!/bin/bash

echo "📁 Checking current directory structure..."
pwd
ls -la

echo "📁 Checking backend directory..."
ls -la backend/

echo "📁 Checking if backend/static exists..."
ls -la backend/static/ || echo "backend/static does not exist!"

echo "📁 Checking if frontend/dist exists..."
ls -la frontend/dist/ || echo "frontend/dist does not exist!"

# Siempre construir el frontend para asegurarnos
echo "🔨 Building frontend..."
cd frontend && npm run build
cd ..

echo "📁 After build - checking frontend/dist..."
ls -la frontend/dist/

echo "📦 Copying to backend/static..."
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo "📁 Final check - backend/static contents:"
ls -la backend/static/

# Iniciar el servidor
echo "🚀 Starting server..."
cd backend && python complete_server.py