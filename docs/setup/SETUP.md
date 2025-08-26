# 🚀 Restaurant Management System - Setup Guide

## Quick Start (Full System)

### Step 1: Install Prerequisites

Make sure you have:
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **MySQL 8.0** (optional - we use Aiven cloud)

### Step 2: Start the Backend

Open a terminal in the project root:

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed the database with initial data
python seed_database.py

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 9000
```

The backend will be available at: **http://localhost:9000**
API documentation at: **http://localhost:9000/docs**

### Step 3: Start the Frontend (Keep backend running!)

Open a **new terminal** in the project root:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not done already)
npm install

# Start the development server
npm run dev -- --host 0.0.0.0
```

The frontend will be available at: **http://localhost:5173**

## 🎯 System is Ready!

### Access Points:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:9000
- **API Docs**: http://localhost:9000/docs

### Demo Accounts:
| Role    | Email                    | Password   |
|---------|-------------------------|------------|
| Admin   | admin@restaurant.com    | admin123   |
| Manager | manager@restaurant.com  | manager123 |
| Waiter  | waiter@restaurant.com   | waiter123  |
| Kitchen | kitchen@restaurant.com  | kitchen123 |
| Cashier | cashier@restaurant.com  | cashier123 |

## 📊 Database Information

The system is configured to use **Aiven MySQL** cloud database:
- Host: mysql-aiven-arenazl.e.aivencloud.com
- Port: 23108
- Database: gastro
- Credentials are in `backend/core/config.py`

## 🧪 Testing the System

1. **Login** with any demo account
2. **Admin** can:
   - View dashboard metrics
   - Manage products
   - Access all areas
3. **Waiter** can:
   - View tables
   - Create orders
   - Send to kitchen
4. **Kitchen** can:
   - View incoming orders
   - Update order status
5. **Cashier** can:
   - Process payments
   - Close orders

## 🐛 Troubleshooting

### Backend won't start:
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Reinstall requirements
pip install -r requirements.txt
```

### Database connection issues:
- Check internet connection (using cloud database)
- Verify credentials in `backend/core/config.py`
- Try running migrations again: `alembic upgrade head`

### Frontend login fails:
- Make sure backend is running on port 9000
- Check browser console for errors
- Clear browser localStorage: Open DevTools → Application → Storage → Clear

### Port already in use:
```bash
# Kill processes on ports
# Linux/Mac:
lsof -ti:9000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend

# Windows:
netstat -ano | findstr :9000
taskkill /PID <PID> /F
```

## 🔧 Manual Database Setup (if seed script fails)

1. Access the API docs: http://localhost:9000/docs
2. Use the `/api/v1/auth/register` endpoint to create users
3. Use the `/api/v1/products` endpoint to add products
4. Use the `/api/v1/tables` endpoint to create tables

## 🐳 Docker Alternative

If you prefer Docker:
```bash
docker-compose up -d
```

Access at the same URLs as above.

## 📝 Important Notes

- The system uses **real-time WebSockets** for kitchen notifications
- All passwords are hashed using bcrypt
- JWT tokens expire after 30 minutes
- The frontend auto-refreshes tokens

## 🆘 Need Help?

1. Check the logs in the terminal
2. Review the API documentation at `/docs`
3. Check browser console for frontend errors
4. Ensure both backend and frontend are running

---

**Ready to go!** Both backend and frontend must be running for the full system to work.