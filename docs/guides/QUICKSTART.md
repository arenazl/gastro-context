# 🚀 Inicio Rápido - Sistema Gastronómico

**Stack Actualizado**: FastAPI + MySQL + React + Vite + Redis + Stripe

Esta guía te llevará de 0 a un sistema gastronómico funcionando en **menos de 10 minutos**.

## ⚡ Setup Súper Rápido (Recomendado)

### **Opción 1: Con Context Engineering (IA) - 5 minutos**

```bash
# 1. Asegúrate de tener Claude Code instalado
# 2. Abre este directorio en Claude Code
# 3. Ejecuta en Claude Code:

/generate-prp INITIAL.md
# Espera a que termine la investigación automática...
# Incluye research de páginas modelo del rubro gastronómico

/execute-prp PRPs/sistema-gastronomico.md
# ¡Se genera todo el código automáticamente!
```

**¡Listo!** Tu sistema gastronómico estará funcionando con:
- ✅ Backend FastAPI completo con MySQL
- ✅ Frontend React + Vite responsive  
- ✅ Base de datos MySQL optimizada para restaurantes
- ✅ WebSockets para tiempo real
- ✅ Integración con Stripe
- ✅ Tests automáticos con coverage

---

### **Opción 2: Setup Manual - 10 minutos**

Si prefieres hacerlo paso a paso:

#### **1. Configuración Inicial**
```bash
# Copiar variables de entorno
cp .env.example .env

# Editar configuraciones básicas
vim .env
# Cambiar: DATABASE_URL (MySQL), JWT_SECRET, STRIPE_KEYS
```

#### **2. Base de Datos con Docker**
```bash
# Levantar MySQL + Redis
docker-compose up -d mysql redis

# Esperar 15 segundos para que inicie MySQL
sleep 15

# Crear las tablas
cd backend
alembic upgrade head
```

#### **3. Backend FastAPI**
```bash
# Instalar dependencias Python
pip install -r requirements.txt

# Iniciar servidor de desarrollo
uvicorn main:app --reload --port 8000
```

#### **4. Frontend React + Vite**
```bash
# En nueva terminal
cd frontend

# Instalar dependencias Node.js
npm install

# Iniciar desarrollo con Vite
npm run dev
```

#### **5. Verificar que Funciona**
```bash
# Backend API docs
open http://localhost:8000/docs

# Frontend React app
open http://localhost:3000

# Health check
curl http://localhost:8000/health

# MySQL con phpMyAdmin (opcional)
docker-compose --profile tools up -d
open http://localhost:8080
```

---

## 🔧 Configuración Mínima Requerida

### **Variables de Entorno Esenciales**

Edita `.env` con estos valores mínimos:

```bash
# Base de datos MySQL (cambiar password)
DATABASE_URL="mysql+pymysql://gastronomy_user:TU_PASSWORD@localhost:3306/gastronomy_db?charset=utf8mb4"

# MySQL específico
MYSQL_HOST="localhost"
MYSQL_USER="gastronomy_user"
MYSQL_PASSWORD="tu_password_seguro"
MYSQL_DATABASE="gastronomy_db"

# JWT (generar secretos únicos)
JWT_SECRET="tu-secreto-super-seguro-mysql-2025"

# Stripe (usar test keys para desarrollo)
STRIPE_SECRET_KEY="sk_test_tu_clave_de_stripe"
STRIPE_PUBLISHABLE_KEY="pk_test_tu_clave_publica"

# URLs básicas
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"

# Frontend React + Vite
VITE_API_URL="http://localhost:8000"
VITE_WS_URL="ws://localhost:8000/ws"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_tu_clave_publica"

# Redis para WebSockets
REDIS_URL="redis://localhost:6379/0"
```

### **Dependencias del Sistema**

Asegúrate de tener instalado:

```bash
# Python 3.9+
python --version

# Node.js 18+
node --version

# Docker (para MySQL + Redis)
docker --version

# Git
git --version

# MySQL Client (opcional para debug)
mysql --version
```

---

## 🎯 Primer Login y Setup

### **1. Crear Usuario Administrador**

```bash
# Ejecutar script de setup inicial
cd backend
python scripts/create_admin.py

# O manualmente vía API:
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@turestaurante.com",
    "password": "admin123",
    "first_name": "Admin",
    "last_name": "Principal",
    "role": "admin"
  }'
```

### **2. Configurar Datos Básicos**

Accede a `http://localhost:3000/admin` y configura:

- ✅ **Información del restaurante**
- ✅ **Mesas** (números, capacidad, ubicación, layout visual)
- ✅ **Categorías** de productos (Entrantes, Principales, Postres, Bebidas)
- ✅ **Productos básicos** para empezar a tomar pedidos
- ✅ **Usuarios** (meseros, cocina, cajeros) con roles específicos

### **3. Primer Pedido de Prueba**

1. Ve a `http://localhost:3000/waiter` (interface React optimizada para tablets)
2. Selecciona una mesa del layout visual
3. Agrega productos al pedido con modificaciones
4. Confirma el pedido
5. Ve a `http://localhost:3000/kitchen` para ver el pedido en cocina
6. Cambia el estado del pedido en tiempo real
7. Ve las notificaciones WebSocket instantáneas

---

## 🛠️ Troubleshooting Común

### **Error: "MySQL no conecta"**

```bash
# Verificar que MySQL está corriendo
docker-compose ps

# Si no está corriendo:
docker-compose up -d mysql

# Ver logs si hay errores:
docker-compose logs mysql

# Conectar a MySQL para debug:
docker-compose exec mysql mysql -u gastronomy_user -p gastronomy_db

# Verificar charset UTF8MB4:
SHOW VARIABLES LIKE 'character_set%';
```

### **Error: "Módulo no encontrado"**

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend React + Vite
cd frontend
rm -rf node_modules package-lock.json
npm install

# Si persiste, limpiar cache de Vite:
npm run build:clean
```

### **Error: "Puerto ya en uso"**

```bash
# Cambiar puertos en .env:
PORT=8001                    # Backend
VITE_PORT=3001              # Frontend Vite

# O matar procesos:
lsof -ti:8000 | xargs kill   # Backend
lsof -ti:3000 | xargs kill   # Frontend
lsof -ti:3306 | xargs kill   # MySQL
```

### **Error: "Stripe no funciona"**

```bash
# Verificar que usas test keys:
STRIPE_SECRET_KEY="sk_test_..."     # NO sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # NO pk_live_...

# Test webhook endpoint:
curl -X POST http://localhost:8000/api/v1/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

### **Error: "Vite no compila"**

```bash
# Limpiar cache de Vite
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist

# Reinstalar dependencias
cd frontend
npm ci

# Verificar configuración de Vite
npm run build -- --debug
```

### **Error: "WebSocket no conecta"**

```bash
# Verificar Redis está corriendo
docker-compose logs redis

# Verificar URL de WebSocket en frontend
echo $VITE_WS_URL

# Test WebSocket connection:
curl --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Sec-WebSocket-Key: test" \
     --header "Sec-WebSocket-Version: 13" \
     http://localhost:8000/ws
```

---

## 📱 Accesos Rápidos

Una vez funcionando, estos son los accesos principales:

| Rol | URL | Descripción | Tecnología |
|-----|-----|-------------|------------|
| **Admin** | `http://localhost:3000/admin` | Panel de administración completo | React SPA |
| **Mesero** | `http://localhost:3000/waiter` | Interface móvil para tablets | React PWA |
| **Cocina** | `http://localhost:3000/kitchen` | Panel de preparación de pedidos | React Real-time |
| **Cajero** | `http://localhost:3000/pos` | Punto de venta y pagos | React + Stripe |
| **API** | `http://localhost:8000/docs` | Documentación Swagger | FastAPI |
| **DB Admin** | `http://localhost:8080` | phpMyAdmin para MySQL | Docker tool |

---

## 🚀 Siguientes Pasos

### **Personalización Básica**

1. **Branding**: Cambiar colores, logo, nombre en `/frontend/src/styles/`
2. **Menú**: Agregar tus productos reales en el panel admin
3. **Layout**: Configurar layout visual de mesas de tu restaurante
4. **Empleados**: Crear usuarios para tu staff con roles específicos

### **Configuración de Producción**

1. **Dominio**: Configurar DNS y certificados SSL
2. **Base de datos**: Migrar a MySQL en la nube (PlanetScale, AWS RDS)
3. **Pagos**: Cambiar a Stripe live keys
4. **Backup**: Configurar backups automáticos de MySQL
5. **Monitoreo**: Setup de logs y métricas con Sentry
6. **CDN**: Configurar CDN para assets estáticos de React

### **Research de Competitors (Automático)**

Este framework incluye research automático de páginas modelo:

```bash
# Ejecutar research de competitors del rubro
cd examples
python puppeteer_research.py

# Resultados en:
./research/competitors/
├── toast_pos_research.json
├── square_restaurants_research.json  
├── touchbistro_research.json
└── CONSOLIDATED_RESEARCH_REPORT.md
```

### **Features Adicionales**

Usa Context Engineering para agregar:

```bash
# Crear nuevo feature con IA
echo "Sistema de delivery integrado" > NEW_FEATURE.md
/generate-prp NEW_FEATURE.md
/execute-prp PRPs/delivery-system.md
```

Ejemplos de features:
- 📊 **Reportes avanzados** de ventas con charts
- 🍕 **Delivery integration** (Uber Eats, PedidosYa, Rappi)
- 📱 **App móvil** para clientes con React Native
- 🏷️ **Programa de fidelidad** con puntos
- 📧 **Email marketing** automático
- 📋 **Gestión de inventario** avanzada con alertas
- 👥 **Sistema de reservas** integrado
- 📈 **Analytics** con dashboard ejecutivo

---

## 🆘 ¿Necesitas Ayuda?

### **Context Engineering**
- Revisa `CLAUDE.md` para reglas del proyecto
- Usa `/generate-prp INITIAL.md` para nuevas features
- Consulta `examples/` para patrones de código
- El research automático investiga competitors

### **Stack Tecnológico**
- **Frontend React + Vite**: Super rápido, HMR instantáneo
- **Backend FastAPI**: API docs automáticas en `/docs`
- **MySQL**: phpMyAdmin en `http://localhost:8080`
- **Stripe**: Test keys para desarrollo seguro
- **WebSockets**: Tiempo real garantizado
- **Docker**: Stack completo containerizado

### **Documentación**
- API: `http://localhost:8000/docs` (Swagger automático)
- Database: Ver `examples/mysql_model.py`
- Components: Ver `examples/react_component.tsx`
- Testing: Ver `examples/testing_pattern.py`

### **Community & Support**  
- Issues: GitHub Issues del repositorio
- Documentación: Carpeta `/docs`
- Examples: Carpeta `/examples`
- Research: Carpeta `/research`

---

## 🎉 ¡Tu Restaurante Ya Está Digital!

Con este setup actualizado tienes un sistema gastronómico de última generación:

### **🔥 Stack Moderno**
- ✅ **React + Vite** - Desarrollo súper rápido con HMR
- ✅ **MySQL 8.0** - Base de datos robusta con transacciones ACID  
- ✅ **FastAPI** - API moderna con documentación automática
- ✅ **WebSockets + Redis** - Tiempo real escalable
- ✅ **Stripe** - Pagos seguros con compliance automático

### **🍽️ Funcionalidades Gastronómicas**
- ✅ **Toma de pedidos** optimizada para tablets
- ✅ **Cocina digital** con notificaciones en tiempo real  
- ✅ **Pagos seguros** con Stripe integration
- ✅ **Administración completa** con reportes y analytics
- ✅ **PWA** para funcionar offline
- ✅ **Layout visual** de mesas interactivo

### **🚀 Context Engineering**
- ✅ **Research automático** de competitors
- ✅ **Patterns específicos** del rubro gastronómico
- ✅ **Generación con IA** en minutos
- ✅ **Testing automático** con coverage
- ✅ **Escalable** para crecer con tu negocio

### **📊 Diferencias del Stack Anterior**

| Aspecto | Antes (Next.js + PostgreSQL) | Ahora (React + Vite + MySQL) |
|---------|-------------------------------|-------------------------------|
| **Frontend** | Next.js SSR complejo | React + Vite súper rápido |
| **Build Time** | 30-60 segundos | 3-10 segundos |
| **HMR** | Lento, a veces se rompe | Instantáneo, siempre funciona |
| **Base de Datos** | PostgreSQL | MySQL (más hosting options) |
| **Setup** | Complejo con SSR | Simple SPA + API |
| **Deployment** | Vercel específico | Cualquier hosting |
| **Performance** | Bueno | Excelente |

**¡Hora de servir con tecnología de vanguardia! 🍽️⚡**

---

## 🔍 Research de Páginas Modelo Incluido

El framework incluye research automático de los mejores sistemas POS:

- **Toast POS** - Líder en restaurantes
- **Square for Restaurants** - Solución integral
- **TouchBistro** - Especialista en tablets
- **Lightspeed** - Enterprise grade
- **Uber Eats Merchant** - Dashboard de delivery
- **OpenTable** - Gestión de reservas
- **Clover** - Hardware integrado

**Patterns extraídos automáticamente para tu implementación** 🎯