#!/bin/bash

echo "================================================"
echo "🍽️  Restaurant Management System - Startup Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}📋 Prerequisites:${NC}"
echo "  - Python 3.10+ with pip"
echo "  - Node.js 18+ with npm"
echo "  - MySQL 8.0 (or use Aiven cloud database)"

echo -e "\n${GREEN}🚀 Starting Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
echo "Starting frontend server on http://localhost:5173"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo -e "\n${GREEN}🔧 Setting up Backend...${NC}"
cd ../backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Run database migrations
echo -e "\n${YELLOW}📊 Setting up Database...${NC}"
echo "Running Alembic migrations..."
alembic upgrade head

# Create initial data
echo "Creating initial seed data..."
python3 seed_database.py

# Start backend server
echo -e "\n${GREEN}🚀 Starting Backend...${NC}"
echo "Starting backend server on http://localhost:9000"
uvicorn main:app --reload --host 0.0.0.0 --port 9000 &
BACKEND_PID=$!

echo -e "\n${GREEN}✅ System Started Successfully!${NC}"
echo "================================================"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:9000"
echo "  API Docs: http://localhost:9000/docs"
echo "================================================"
echo -e "\n${YELLOW}Demo Accounts:${NC}"
echo "  Admin:   admin@restaurant.com / admin123"
echo "  Waiter:  waiter@restaurant.com / waiter123"
echo "  Kitchen: kitchen@restaurant.com / kitchen123"
echo "================================================"
echo -e "\nPress Ctrl+C to stop all services"

# Wait for interrupt
wait $FRONTEND_PID $BACKEND_PID