## FEATURE:

Sistema completo de administración gastronómica que incluye:

### **🏪 Gestión del Negocio**
1. **Dashboard Principal**: Métricas en tiempo real (ventas del día, pedidos activos, mesas ocupadas)
2. **Gestión de Productos**: ABM completo de productos, categorías, variantes, ingredientes, precios
3. **Control de Inventario**: Stock en tiempo real, alertas de productos agotados, costo de ingredientes
4. **Gestión de Mesas**: Layout del restaurante, estados de mesas, tiempo de ocupación

### **📱 Toma de Pedidos (Para Meseros)**
1. **Interface Mobile**: PWA optimizada para tablets y móviles con React
2. **Selección de Mesa**: Vista del layout del restaurante  
3. **Menú Interactivo**: Categorías, productos, variantes, ingredientes extra
4. **Carrito de Pedido**: Resumen en tiempo real, notas especiales, modificaciones
5. **Envío a Cocina**: Notificaciones instantáneas vía WebSocket

### **👨‍🍳 Panel de Cocina**
1. **Cola de Pedidos**: Lista priorizada por tiempo y urgencia
2. **Detalles del Pedido**: Ingredientes, modificaciones, alergias
3. **Control de Tiempos**: Cronómetro por pedido, alertas de demora
4. **Estados**: Recibido → En preparación → Listo → Entregado

### **💰 Gestión Financiera**
1. **Procesamiento de Pagos**: Efectivo, tarjeta (Stripe), transferencias
2. **Facturación**: Generación automática de tickets y facturas
3. **Reportes**: Ventas por día/mes, productos más vendidos, análisis de rentabilidad
4. **Control de Caja**: Apertura/cierre de caja, arqueos

## EXAMPLES:

### **Referencias de UI/UX Gastronómicas (Para Research con Puppeteer)**:

#### **Sistemas POS Profesionales**
- **Toast POS**: https://pos.toasttab.com/ - Sistema POS líder para restaurantes
  - Interface limpia para tablets
  - Gestión de mesas visual
  - Reportes en tiempo real
  
- **Square for Restaurants**: https://squareup.com/us/en/restaurants - Solución integral moderna
  - Dashboard de métricas claras
  - Interface mobile-first
  - Integración de pagos perfecta

- **TouchBistro**: https://www.touchbistro.com/ - POS específico para restaurantes
  - Diseño optimizado para tablets
  - Flujo de pedidos intuitivo
  - Gestión de staff eficiente

- **Lightspeed Restaurant**: https://www.lightspeedhq.com/pos/restaurant/ - Solución completa
  - Analytics avanzados
  - Control de inventario
  - Multi-location management

#### **Plataformas de Gestión**
- **Uber Eats Merchant**: https://merchants.ubereats.com/ - Dashboard de delivery
  - Métricas de rendimiento
  - Gestión de pedidos online
  - Interface clean y moderna

- **OpenTable**: https://www.opentable.com/ - Gestión de reservas líder
  - Calendar view de mesas
  - Customer management
  - Reporting detallado

- **Resy**: https://resy.com/ - Sistema de reservas moderno
  - UX móvil excepcional
  - Design system consistente
  - Real-time availability

#### **Hardware POS Integrado**
- **Clover**: https://www.clover.com/pos-systems/restaurant - Hardware y software
  - Interface táctil intuitiva
  - Integración payment seamless
  - Staff management

### **Patrones de Diseño a Extraer**:
- **Color schemes** para restaurantes (cálidos, profesionales)
- **Iconografía** específica del rubro gastronómico
- **Navigation patterns** para tablets
- **Table management layouts** 
- **Order flow UX** optimizado
- **Real-time status indicators**
- **Mobile-responsive patterns**

## DOCUMENTATION:

### **Backend & Database**:
- **FastAPI Tutorial**: https://fastapi.tiangolo.com/tutorial/first-steps/
- **FastAPI WebSockets**: https://fastapi.tiangolo.com/advanced/websockets/
- **SQLAlchemy**: https://docs.sqlalchemy.org/en/20/
- **SQLAlchemy MySQL**: https://docs.sqlalchemy.org/en/20/dialects/mysql.html
- **MySQL**: https://dev.mysql.com/doc/refman/8.0/en/
- **Pydantic**: https://docs.pydantic.dev/latest/

### **Frontend con React + Vite**:
- **React**: https://react.dev/learn
- **React Hooks**: https://react.dev/reference/react
- **Vite**: https://vitejs.dev/guide/
- **React Router**: https://reactrouter.com/en/main
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Headless UI**: https://headlessui.com/react
- **React Hook Form**: https://react-hook-form.com/get-started

### **Testing Frontend**:
- **Vitest**: https://vitest.dev/guide/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **MSW**: https://mswjs.io/docs/ - Para mock de APIs

### **Pagos y Servicios**:
- **Stripe API**: https://stripe.com/docs/api
- **Stripe Payments**: https://stripe.com/docs/payments
- **Stripe React**: https://stripe.com/docs/stripe-js/react
- **WebSocket Client**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

### **PWA y Service Workers**:
- **PWA Guide**: https://web.dev/progressive-web-apps/
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Vite PWA Plugin**: https://vite-pwa-org.netlify.app/

### **MySQL Específico**:
- **MySQL InnoDB**: https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html
- **MySQL Performance**: https://dev.mysql.com/doc/refman/8.0/en/optimization.html
- **MySQL Security**: https://dev.mysql.com/doc/refman/8.0/en/security.html

## OTHER CONSIDERATIONS:

### **Requisitos Críticos del Negocio**:
1. **Tiempo Real**: Los pedidos deben llegar a cocina instantáneamente
2. **Offline Support**: El sistema debe funcionar aunque falle internet temporalmente
3. **Multi-dispositivo**: Desktop para admin, tablets para meseros, pantallas para cocina
4. **Roles y Permisos**: Admin, gerente, cajero, mesero, cocinero con permisos específicos

### **Rendimiento**:
- **Carga inicial**: < 3 segundos en tablets
- **Transacciones**: < 500ms para tomar pedidos
- **Capacidad**: Mínimo 50 pedidos simultáneos
- **Base de datos**: Índices MySQL optimizados para consultas frecuentes

### **Seguridad**:
- **Autenticación**: JWT con refresh tokens
- **Pagos**: PCI DSS compliance con Stripe
- **Datos**: Encriptación de información sensible
- **Acceso**: Rate limiting y validación estricta

### **Stack Tecnológico Específico**:

#### **Frontend - React + Vite**
```javascript
// Estructura del proyecto frontend
src/
├── components/          # Componentes reutilizables
│   ├── common/         # Componentes base (Button, Modal, etc.)
│   ├── forms/          # Formularios específicos
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── restaurant/     # Componentes específicos del negocio
├── pages/              # Páginas principales
│   ├── admin/          # Panel administrativo
│   ├── waiter/         # Interface para meseros
│   ├── kitchen/        # Panel de cocina
│   └── pos/            # Punto de venta
├── hooks/              # Custom React hooks
├── services/           # API calls y WebSocket
├── utils/              # Utilidades
└── styles/             # Tailwind config y estilos custom
```

#### **Base de Datos - MySQL**
```sql
-- Configuración MySQL optimizada para restaurantes
CREATE DATABASE gastronomy_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Índices críticos para performance
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_orders_table_status ON orders(table_number, status);
CREATE INDEX idx_order_items_order_status ON order_items(order_id, status);
CREATE INDEX idx_products_category_available ON products(category_id, is_available);
```

### **Integrationes Futuras**:
- **Delivery Apps**: Uber Eats, Rappi, PedidosYa
- **Contabilidad**: Sistemas de facturación locales
- **Inventario**: Proveedores automáticos
- **Marketing**: Email, SMS, notificaciones push

### **Research con Puppeteer - Patrones a Extraer**:

#### **Navigation Patterns**
- Sidebar navigation para diferentes roles
- Tab navigation para categorías de productos
- Breadcrumb navigation para flujos complejos

#### **Table Management UI**
- Visual table layout representations
- Color coding para estados de mesa
- Drag & drop para asignación de meseros

#### **Order Flow UX**
- Add to cart animations
- Progress indicators para estados de pedido
- Real-time notifications para updates

#### **Dashboard Layouts**
- Metric cards con iconografía clara
- Charts y gráficos para analytics
- Quick action buttons para tareas comunes

#### **Mobile-First Patterns**
- Touch-friendly buttons (44px mínimo)
- Swipe gestures para acciones rápidas
- Modal patterns para tablets

### **Casos Edge que manejar**:
- **Internet caído**: Cache local y sincronización posterior
- **Ingredientes agotados**: Bloqueo automático en el menú
- **Cambios de precio**: Actualización en tiempo real sin afectar pedidos en curso
- **Cancelaciones**: Manejo de reembolsos y notificaciones
- **Picos de demanda**: Auto-scaling y balanceado de carga

### **Testing Requirements**:
- **Unit Tests**: Lógica de pedidos, cálculos de precios, validaciones
- **Integration Tests**: API endpoints, base de datos MySQL, WebSockets
- **E2E Tests**: Flujo completo de pedidos, procesamiento de pagos
- **Performance Tests**: Manejo de 50+ pedidos simultáneos
- **Security Tests**: Validación de permisos, sanitización de inputs

### **Arquitectura Técnica React + MySQL**:

```
Sistema Gastronómico
├── Backend (FastAPI + MySQL)
│   ├── /api/v1/auth/          # Autenticación JWT
│   ├── /api/v1/products/      # Gestión de productos
│   ├── /api/v1/orders/        # Manejo de pedidos
│   ├── /api/v1/tables/        # Gestión de mesas
│   ├── /api/v1/payments/      # Stripe integration
│   ├── /api/v1/reports/       # Analytics y reportes
│   └── /ws/                   # WebSocket endpoints
├── Frontend (React + Vite)
│   ├── /admin                 # Panel administrativo (SPA)
│   ├── /waiter                # Interface para meseros (PWA)
│   ├── /kitchen               # Panel de cocina (Real-time)
│   └── /pos                   # Punto de venta
├── Database (MySQL 8.0)
│   ├── users, roles           # Autenticación
│   ├── products, categories   # Catálogo
│   ├── orders, order_items    # Pedidos
│   ├── tables, reservations   # Gestión de mesas
│   └── payments, invoices     # Facturación
└── Infrastructure
    ├── Docker containers      # producción
    ├── WebSocket server       # Tiempo real
    └── Stripe webhooks        # Procesamiento de pagos
```

### **Deployment y DevOps**:
- **Containerización**: Docker para producción
- **Base de datos**: MySQL con backups automáticos
- **Monitoreo**: Logs estructurados y health checks
- **CI/CD**: Tests automáticos en cada deploy
- **Scaling**: Load balancer para múltiples instancias