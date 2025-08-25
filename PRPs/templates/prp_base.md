# 🍽️ [FEATURE_NAME] - Gastronomy System PRP

**Date**: [TODAY] | **Confidence**: [8-10]/10 | **Framework**: FastAPI + MySQL + React + Vite

---

## 🎯 Objective

**Feature**: [SPECIFIC GASTRONOMY FEATURE IN ONE SENTENCE]
**Business Impact**: [RESTAURANT OPERATION IMPROVEMENT]
**User Role**: [admin/waiter/kitchen/cashier] 
**Success Criteria**: [MEASURABLE RESTAURANT OUTCOME]

---

## 📚 Required Context & Research

### **Framework Patterns (MUST FOLLOW)**
```yaml
backend_pattern: "examples/fastapi_endpoint.py"
  - FastAPI with type hints
  - MySQL with SQLAlchemy
  - JWT authentication with roles
  - WebSocket for real-time updates
  - Background tasks for notifications

database_pattern: "examples/mysql_model.py"
  - InnoDB engine with utf8mb4
  - DECIMAL for money (10,2 precision)
  - Indexes for restaurant queries
  - Timestamp mixins for audit trail

frontend_pattern: "examples/react_component.tsx"
  - React + Vite (NO Next.js)
  - TypeScript with proper typing
  - Tailwind CSS for mobile-first
  - WebSocket hooks for real-time
  - Offline support with localStorage
```

### **Gastronomy Business Rules (CRITICAL)**
```yaml
order_flow: "pending → preparing → ready → delivered → paid"
real_time_requirements:
  - Orders reach kitchen in <2 seconds
  - WebSocket notifications with sound alerts
  - Offline queue with sync when reconnected

financial_precision:
  - DECIMAL(10,2) for all money fields
  - Tax calculation with 21% IVA Argentina
  - Transactional integrity for payments

restaurant_roles:
  - admin: Full access, reports, configuration
  - manager: Operations, staff management, reports
  - waiter: Table management, order creation
  - kitchen: Order queue, status updates
  - cashier: Payment processing, closing orders
```

### **Documentation References (RESEARCH COMPLETED)**
```yaml
fastapi_docs: "https://fastapi.tiangolo.com/tutorial/"
mysql_docs: "https://docs.sqlalchemy.org/en/20/dialects/mysql.html"
react_docs: "https://react.dev/learn"
vite_docs: "https://vitejs.dev/guide/"
stripe_docs: "https://stripe.com/docs/api"
websocket_docs: "https://fastapi.tiangolo.com/advanced/websockets/"
```

### **Critical Gotchas & Solutions**
```python
# GOTCHA: WebSocket disconnections during peak hours
# SOLUTION: Implement retry with exponential backoff
async def send_with_retry(ws, data, max_retries=3):
    for attempt in range(max_retries):
        try:
            await ws.send_json(data)
            return True
        except WebSocketDisconnect:
            await asyncio.sleep(2 ** attempt)
    await queue_offline_order(data)  # Fallback

# GOTCHA: MySQL connection pool exhaustion
# SOLUTION: Configure pool properly in settings
DB_POOL_SIZE = 20
DB_MAX_OVERFLOW = 30
DB_POOL_RECYCLE = 3600

# GOTCHA: Decimal precision loss in JavaScript
# SOLUTION: Always send prices as strings from API
@router.get("/products")
async def get_products():
    return [
        {
            "id": product.id,
            "name": product.name,
            "price": str(product.base_price)  # String not float!
        }
        for product in products
    ]
```

---

## 🏗️ Implementation Blueprint

### **Database Schema (MySQL)**
```sql
-- Follow examples/mysql_model.py pattern
CREATE TABLE [table_name] (
    id INT PRIMARY KEY AUTO_INCREMENT,
    [specific_fields],
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance indexes for restaurant queries
CREATE INDEX idx_[table]_[common_query] ON [table]([fields]);
```

### **Backend API Structure (FastAPI)**
```python
# File: backend/api/[feature].py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from models import [Model]
from auth import require_role, get_current_user
from websocket import manager

router = APIRouter(prefix="/api/v1/[feature]", tags=["[feature]"])

@router.post("/", response_model=[Model]Response)
async def create_[resource](
    data: [Model]Create,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["allowed_roles"]))
):
    """[RESTAURANT_BUSINESS_LOGIC_DESCRIPTION]"""
    # 1. Validate restaurant business rules
    # 2. Create/update database records
    # 3. Send WebSocket notifications
    # 4. Return response with relationships loaded
```

### **Frontend Component (React + Vite)**
```tsx
// File: frontend/src/components/[Feature].tsx
import React, { useState, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useOffline } from '../hooks/useOffline'

interface [Model] {
  id: number
  // Restaurant-specific fields
}

export const [Component]: React.FC = () => {
  const [state, setState] = useState<[Model][]>([])
  const { isConnected, sendMessage } = useWebSocket('[feature]')
  const { isOffline, queueRequest } = useOffline()
  
  // Restaurant-specific handlers
  const handle[Action] = async () => {
    if (isOffline) {
      await queueRequest('[action]', data)
    } else {
      await sendMessage({ type: '[action]', data })
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Mobile-first tablet UI for restaurant staff */}
      <div className="max-w-6xl mx-auto">
        {/* Feature-specific UI */}
      </div>
    </div>
  )
}
```

---

## 📋 Implementation Tasks (Ordered)

### **Phase 1: Database & Models**
1. **Create SQLAlchemy model**
   - File: `backend/models/[feature].py`
   - Pattern: Follow `examples/mysql_model.py`
   - Include: Relationships, validators, indexes

2. **Generate migration**
   ```bash
   alembic revision --autogenerate -m "add_[feature]_table"
   alembic upgrade head
   ```

### **Phase 2: Backend API**
3. **Implement API endpoints**
   - File: `backend/api/[feature].py`
   - Pattern: Follow `examples/fastapi_endpoint.py`
   - Include: CRUD operations, role validation

4. **Add WebSocket handlers**
   - File: `backend/websocket/[feature].py`
   - Real-time notifications for restaurant staff

### **Phase 3: Frontend Components**
5. **Create React components**
   - File: `frontend/src/components/[Feature].tsx`
   - Pattern: Follow `examples/react_component.tsx`
   - Mobile-first design for tablets

6. **Add to routing**
   - Update `frontend/src/App.tsx`
   - Protected routes by role

### **Phase 4: Integration & Testing**
7. **Integration testing**
   - Test API endpoints
   - Test WebSocket events
   - Test offline functionality

8. **Restaurant workflow testing**
   - Complete user journey
   - Edge cases (offline, errors)

---

## ✅ Validation Gates

### **Level 1: Code Quality**
```bash
# Backend
cd backend
ruff check . --fix
ruff format .
mypy . --strict

# Frontend  
cd frontend
npm run lint
npm run type-check
```

### **Level 2: Unit Tests**
```bash
# Backend tests
pytest tests/unit/test_[feature].py -v

# Frontend tests
npm test -- --testNamePattern="[Feature]"
```

### **Level 3: Integration Tests**
```bash
# API integration
pytest tests/integration/test_[feature]_api.py -v

# WebSocket integration
pytest tests/integration/test_[feature]_ws.py -v
```

### **Level 4: Restaurant Workflow**
```bash
# End-to-end restaurant flow
pytest tests/e2e/test_[feature]_workflow.py -v

# Performance with restaurant load
locust -f tests/performance/test_[feature].py --users 20
```

---

## 🎯 Restaurant-Specific Validation

### **Business Logic Tests**
- [ ] **Role permissions work correctly**
- [ ] **Real-time notifications reach intended recipients**
- [ ] **Offline mode queues actions properly**
- [ ] **Money calculations are precise**
- [ ] **Order flow states transition correctly**

### **User Experience Tests**
- [ ] **UI works on tablets (min 44px touch targets)**
- [ ] **Responsive design works in landscape**
- [ ] **Loading states provide feedback**
- [ ] **Error messages are clear and actionable**
- [ ] **Offline indicator shows connection status**

### **Performance Tests**
- [ ] **API responses < 200ms**
- [ ] **WebSocket notifications < 100ms**
- [ ] **Database queries use proper indexes**
- [ ] **Frontend renders < 3 seconds on tablets**

---

## 🔧 Integration Points

### **Database Connection**
```python
# Use existing database config
from backend.core.database import get_db
```

### **Authentication**
```python
# Use existing auth system
from backend.auth import require_role, get_current_user
```

### **WebSocket Manager**
```python
# Use existing WebSocket manager
from backend.websocket.manager import manager
```

### **Frontend Hooks**
```tsx
// Use existing custom hooks
import { useWebSocket } from '../hooks/useWebSocket'
import { useOffline } from '../hooks/useOffline'
import { useApi } from '../hooks/useApi'
```

---

## 🚨 Final Checklist

**MUST PASS ALL:**
- [ ] **Feature works end-to-end for restaurant staff**
- [ ] **Real-time updates work via WebSocket**
- [ ] **Offline mode works and syncs when reconnected**
- [ ] **Role-based access control enforced**
- [ ] **Mobile-first UI works on tablets**
- [ ] **Database transactions maintain consistency**
- [ ] **Error handling covers restaurant edge cases**
- [ ] **Performance meets restaurant requirements**
- [ ] **Code follows project patterns exactly**

---

## 🎖️ Success Criteria

**Technical Success:**
- All tests pass
- Performance benchmarks met
- Code quality gates passed
- Integration points working

**Business Success:**
- Restaurant staff can use the feature
- Improves operational efficiency
- Reduces errors in restaurant workflow
- Integrates seamlessly with existing system

**Confidence Score: [8-10]/10**

---

*This PRP follows the gastronomy system Context Engineering patterns and provides all necessary context for one-pass implementation with Claude Code.*