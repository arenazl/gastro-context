# Restaurant Management System 🍽️

A comprehensive restaurant management system built with FastAPI, MySQL, and React+Vite for real-time order management, kitchen operations, and payment processing.

## ✨ Current Status

The system now has a **fully functional frontend** with all major interfaces implemented! You can test the complete flow from table selection → order creation → kitchen display → payment processing.

### 🎉 What's Working Now

#### Frontend (100% UI Complete)
- ✅ **Login System** with role-based authentication and demo accounts
- ✅ **Dashboard** with sales metrics and recent activity
- ✅ **Table Management** - Visual grid showing table status (available/occupied/reserved)
- ✅ **Order Creation** - Product selection with categories, cart, and special instructions
- ✅ **Kitchen Display** - Real-time order queue with status management and timers
- ✅ **POS Checkout** - Complete payment interface with tip calculation
- ✅ **Product Management** - CRUD operations for menu items with availability toggle

#### Backend (Partially Complete)
- ✅ Database schema with all models (users, products, orders, tables, payments)
- ✅ JWT authentication system with refresh tokens
- ✅ Product management API endpoints
- ⏳ Order/Table/Payment APIs (using mock data for now)

## 🚀 Quick Start

### Frontend is Ready to Test!

```bash
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Start the development server
npm run dev

# Frontend will be available at http://localhost:5173
```

### Backend Setup (Optional - Frontend works with mock data)

```bash
# 1. Install Python dependencies
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Run database migrations
alembic upgrade head

# 3. Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Backend API will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

## 🔑 Demo Credentials

Click the role buttons on the login page to auto-fill credentials:

| Role    | Email                    | Password   | Access                                    |
|---------|-------------------------|------------|-------------------------------------------|
| Admin   | admin@restaurant.com    | admin123   | Full system access                       |
| Waiter  | waiter@restaurant.com   | waiter123  | Tables, Orders                           |
| Kitchen | kitchen@restaurant.com  | kitchen123 | Kitchen display only                     |

## 📱 User Interfaces

### 1. **Waiter Flow** 
- Login → Tables → Select Available Table → Create Order → Send to Kitchen
- Mobile-optimized for tablets
- Real-time table status updates

### 2. **Kitchen Display**
- See incoming orders with timer
- Mark orders as: Pending → Preparing → Ready → Delivered
- Priority highlighting for rush orders

### 3. **POS Checkout**
- Select orders ready for payment
- Add tips (percentage or custom)
- Multiple payment methods (card/cash/mobile)
- Receipt printing

### 4. **Admin Dashboard**
- View sales metrics and statistics
- Manage products and categories
- Monitor recent activity

## 🏗️ System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  React+Vite     │────▶│   FastAPI        │────▶│   MySQL         │
│  Frontend       │     │   Backend        │     │   Database      │
│                 │     │                  │     │   (Aiven)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
      │                         │
      │                         │
      ▼                         ▼
┌─────────────────┐     ┌──────────────────┐
│  Tailwind CSS   │     │  WebSocket       │
│  Styling        │     │  Real-time       │
└─────────────────┘     └──────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with hooks
- **Vite 5** - Lightning fast HMR and builds
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Headless UI** - Accessible components
- **Heroicons** - Beautiful icons
- **Axios** - HTTP client with interceptors

### Backend
- **FastAPI** - High-performance async Python
- **SQLAlchemy** - ORM with async support
- **MySQL** - Production database (Aiven cloud)
- **JWT** - Secure authentication
- **Alembic** - Database migrations
- **Pydantic** - Data validation

## 📊 Features Status

### ✅ Completed
- Complete UI for all user roles
- Authentication system with JWT
- Role-based access control
- Product management (CRUD)
- Visual table management
- Order creation with cart
- Kitchen display system
- POS checkout with tips
- Dashboard with metrics

### 🚧 In Progress
- WebSocket real-time updates
- Complete order API endpoints
- Table management API
- Payment processing with Stripe
- Kitchen notifications

### 📋 Planned
- Inventory management
- Staff scheduling
- Customer loyalty program
- Analytics and reporting
- Mobile PWA support
- Offline mode

## 🧪 Testing

The frontend includes mock data for all features, allowing you to test the complete flow without the backend:

1. **Login** with any demo account
2. **Navigate** through different interfaces based on role
3. **Create orders** (mock data saved locally)
4. **Manage kitchen** queue (simulated real-time)
5. **Process payments** (mock processing)

## 📁 Project Structure

```
gastro-context/
├── backend/
│   ├── api/            # API endpoints
│   ├── core/           # Core configuration
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   └── main.py         # FastAPI app
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React contexts
│   │   ├── pages/      # Page components
│   │   └── services/   # API services
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

Frontend (`.env`):
```bash
VITE_API_URL=http://localhost:8000
```

Backend (`backend/core/config.py`):
```python
# Already configured for Aiven MySQL
DB_HOST = "mysql-aiven-arenazl.e.aivencloud.com"
DB_PORT = 23108
DB_NAME = "gastro"
```

## 🐛 Troubleshooting

### Frontend Issues
- **Vite not starting**: Ensure Node.js 18+ is installed
- **Styles not loading**: Run `npm install` to get Tailwind dependencies
- **Login not working**: Frontend uses mock auth, any demo credentials work

### Backend Issues
- **Database connection**: Check Aiven credentials in config.py
- **Module not found**: Activate virtual environment and install requirements
- **Port already in use**: Change port in uvicorn command

## 📈 Validation Gates

As per the PRP validation requirements:

1. ✅ **Frontend Exists** - Complete React+Vite UI
2. ✅ **User Can Interact** - All interfaces functional with mock data
3. ✅ **Basic Flow Works** - Login → Table → Order → Kitchen → Payment
4. ✅ **Error Handling** - Form validation and error states
5. ⏳ **Real-time Updates** - WebSocket pending
6. ⏳ **Payment Processing** - Stripe integration pending
7. ✅ **Mobile Responsive** - Tablet-optimized for waiters
8. ⏳ **Offline Support** - PWA features pending

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License

## 🙏 Acknowledgments

- Built with FastAPI, React, and Vite
- Database hosted on Aiven
- UI components from Headless UI and Heroicons
- Styled with Tailwind CSS

---

**Note**: This is a demonstration system. The frontend is fully functional with mock data while backend API completion is in progress. Perfect for testing UI/UX flows and demonstrations!