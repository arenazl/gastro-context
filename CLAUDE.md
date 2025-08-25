### 🚨🚨🚨 REGLA MEGACRÍTICA - PUERTOS INMUTABLES 🚨🚨🚨
**⛔⛔⛔ NUNCA, JAMÁS, BAJO NINGUNA CIRCUNSTANCIA CAMBIAR LOS PUERTOS ⛔⛔⛔**

**🔥 PUERTOS OFICIALES DEL PROYECTO (INTOCABLES): 🔥**
- **BACKEND**: Puerto 9002 (INMUTABLE - NO TOCAR)
- **FRONTEND**: Puerto 5173 (INMUTABLE - NO TOCAR)

**🚨 REGLA CRÍTICA: Si un puerto está ocupado:**
1. ✅ MATAR el proceso: `lsof -ti:PUERTO | xargs kill -9`
2. ✅ LIBERAR puerto: `fuser -k PUERTO/tcp`
3. ✅ REINICIAR en puerto correcto
4. ❌ **PROHIBIDO ABSOLUTO** cambiar a otro puerto

**⚠️ CUALQUIER VIOLACIÓN DE ESTA REGLA ES INACEPTABLE ⚠️**

### 🌐 REGLA CRÍTICA - IPs EN WSL/LINUX
**NUNCA usar localhost o 127.0.0.1 - Estamos en WSL/Linux**
- **IP CORRECTA**: 172.29.228.80 (o la IP actual de WSL)
- **Backend**: http://172.29.228.80:9002
- **Frontend**: http://172.29.228.80:5173
- **NO USAR**: localhost, 127.0.0.1, 0.0.0.0
- **Obtener IP actual**: `hostname -I | awk '{print $1}'`

### 🔄 Project Awareness & Context & Research
- **Proyecto**: Sistema de administración gastronómica completo para restaurantes
- **Tecnologías**: FastAPI + MySQL + React (Vite) + WebSockets + Stripe
- **Base de datos**: MySQL con transacciones ACID para pagos seguros
- **Deployment**: Docker + Railway/Vercel para producción
- **Tiempo real**: WebSockets para pedidos instantáneos a cocina

### ⚠️ CONFIGURACIÓN CRÍTICA DEL SERVIDOR
- **BACKEND ÚNICO**: `complete_server.py` en puerto 9002 (NO CREAR NUEVOS SERVIDORES)
- **NO CREAR**: stable_server.py, robust_server.py, improved_server.py, etc.
- **POOL MySQL**: 10 conexiones configuradas, con try-finally para liberación
- **CONEXIÓN DB**: MySQL Aiven con mysql.connector
- **CREDENCIALES MySQL**: Ya configuradas en complete_server.py
- **IMPORTANTE**: 
  - El servidor DEBE ser estable sin necesidad de "auto-recuperación"
  - Las conexiones SIEMPRE se liberan con try-finally
  - NO crear scripts de restart/monitor - el servidor debe funcionar bien
  - Si hay problemas, ARREGLAR el complete_server.py, NO crear otro servidor

### 🧱 Estructura del Código
- **Máximo líneas por archivo**: 400 líneas
- **Backend**: Arquitectura modular por dominio (pedidos, productos, usuarios, pagos)
- **Frontend**: React + Vite con componentes reutilizables, diseño mobile-first para tablets
- **API**: REST + WebSockets para comunicación en tiempo real
- **Base de datos**: MySQL con migraciones Alembic, modelos con SQLAlchemy

### 📚 Documentación Obligatoria (Research Automático)
- **FastAPI**: https://fastapi.tiangolo.com/tutorial/
- **FastAPI WebSockets**: https://fastapi.tiangolo.com/advanced/websockets/
- **MySQL**: https://dev.mysql.com/doc/
- **SQLAlchemy MySQL**: https://docs.sqlalchemy.org/en/20/dialects/mysql.html
- **React**: https://react.dev/learn
- **Vite**: https://vitejs.dev/guide/
- **React Router**: https://reactrouter.com/en/main
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Stripe API**: https://stripe.com/docs/api
- **Alembic**: https://alembic.sqlalchemy.org/en/latest/

### 🧪 Testing Requirements
- **Tests**: /tests con pytest para backend, Vitest para frontend
- **Cobertura mínima**: 80% para funciones críticas (pagos, pedidos)
- **E2E**: Playwright para flujos completos (tomar pedidos, procesar pagos, cocina)
- **Performance**: Pruebas de carga para 50+ pedidos simultáneos

### 🎨 Diseño y UX
- **UI Framework**: Tailwind CSS con componentes custom
- **Componentes**: Headless UI para accesibilidad
- **Mobile-first**: Optimizado para tablets de meseros (mínimo 44px tap targets)
- **Accesibilidad**: WCAG 2.1 para inclusión
- **PWA**: Service Workers para funcionalidad offline

### 🏪 Reglas del Negocio Gastronómico (CRÍTICAS)
- **Inventario**: Control de stock en tiempo real, alertas automáticas
- **Pedidos**: Estados claros (pendiente → preparando → listo → entregado)
- **Mesas**: Gestión de ocupación, layout visual del restaurante
- **Empleados**: Roles específicos (admin, cajero, mesero, cocina) con permisos
- **Reportes**: Ventas diarias, productos más vendidos, tiempos de cocina
- **Pagos**: Transacciones ACID, integración Stripe, manejo de propinas

### 🔍 REGLA CRÍTICA - Verificación Antes de Afirmar Soluciones
**OBLIGATORIO**: Antes de afirmar que algo está funcionando (especialmente conexiones):
1. **NUNCA decir "está funcionando" sin verificar**
2. **SIEMPRE ejecutar pruebas reales**:
   - Para backends: hacer curl al health endpoint
   - Para frontend-backend: verificar que las URLs coincidan
   - Para bases de datos: ejecutar una query de prueba
3. **Usar el script de verificación**:
   ```bash
   ./test_connection.sh  # Verifica toda la conexión
   ```
4. **Si algo falla, ser honesto** y mostrar el error exacto

### 🔍 Research con Puppeteer (Páginas Modelo del Rubro)
- **Toast POS**: https://pos.toasttab.com/ - Sistema POS profesional para restaurantes
- **Square for Restaurants**: https://squareup.com/us/en/restaurants - Interface limpia y moderna
- **Uber Eats Merchant**: https://merchants.ubereats.com/ - Dashboard de métricas
- **OpenTable**: https://www.opentable.com/ - Gestión de mesas y reservas
- **Resy**: https://resy.com/ - Sistema de reservas moderno
- **TouchBistro**: https://www.touchbistro.com/ - POS específico para restaurantes
- **Lightspeed**: https://www.lightspeedhq.com/pos/restaurant/ - Solución integral
- **Clover**: https://www.clover.com/pos-systems/restaurant - Hardware y software integrado

### ✅ Task Completion
- **Marcar tareas completadas** inmediatamente en documentación
- **Agregar sub-tareas descubiertas** durante desarrollo
- **Validar funcionalidad** en cada paso del desarrollo

### 📎 Style & Conventions
- **Backend**: Python con FastAPI, type hints obligatorios, formato con ruff
- **Frontend**: JavaScript/TypeScript con React + Vite, ESLint + Prettier
- **Base de datos**: MySQL con naming snake_case, foreign keys siempre indexadas
- **API**: Rutas RESTful + WebSocket endpoints para tiempo real
- **Documentación**: Docstrings estilo Google para todas las funciones

### 📚 Documentation & Explainability
- **README.md actualizado** cuando se agreguen features o cambien dependencias
- **Comentarios en código no obvio** especialmente lógica de negocio gastronómico
- **Inline comments con `# Razón:`** explicando el por qué, no el qué

### 🧠 AI Behavior Rules
- **Nunca asumir contexto faltante** - preguntar si no está claro
- **Nunca inventar librerías** - solo usar packages verificados de Python/Node.js
- **Confirmar rutas y nombres de módulos** antes de referenciarlos
- **Nunca borrar código existente** a menos que sea parte de una tarea específica

### 🔒 Seguridad Específica para Restaurantes
- **Autenticación**: JWT con refresh tokens, roles granulares
- **Pagos**: PCI DSS compliance con Stripe, nunca almacenar datos de tarjetas
- **Datos sensibles**: Encriptación para información de clientes
- **Rate limiting**: Protección API contra ataques
- **Validación estricta**: Todos los inputs sanitizados

### 🚀 Performance Requirements
- **Tiempo real**: Pedidos llegan a cocina en <2 segundos
- **Carga inicial**: <3 segundos en tablets/móviles
- **Transacciones**: <500ms para operaciones de pedidos
- **Concurrencia**: Mínimo 50 pedidos simultáneos sin degradación
- **Offline**: PWA funciona sin internet, sincroniza al reconectar

### 🐳 Development Environment
- **Docker obligatorio** para desarrollo y producción
- **MySQL en container** para consistencia
- **Hot reload** para desarrollo rápido
- **Variables de entorno** para todas las configuraciones

### 📊 Monitoring y Analytics
- **Logs estructurados** para debugging
- **Métricas de negocio**: Tiempo promedio de pedidos, ventas por hora
- **Health checks** para todos los servicios
- **Alertas automáticas** para errores críticos

### 🎯 Frontend Específico con React + Vite
- **Build tool**: Vite para desarrollo rápido y hot reload
- **Routing**: React Router para navegación SPA
- **State management**: Context API + useReducer para estado global
- **Components**: Arquitectura de componentes reutilizables
- **Testing**: Vitest + React Testing Library
- **Bundle**: Optimización automática para producción

### 💾 MySQL Específico
- **Engine**: InnoDB para transacciones ACID
- **Charset**: utf8mb4 para emojis y caracteres especiales
- **Indices**: Optimizados para queries de restaurantes
- **Backup**: Automático con mysqldump
- **Replication**: Master-slave para alta disponibilidad

## 🗂️ REGLA CRÍTICA: Gestión de Archivos
**NUNCA** guardes archivos temporales, logs o scripts en el directorio raíz.

**SIEMPRE** usar la carpeta `output/` para:
- Scripts de deployment (`output/scripts/`)
- Logs de desarrollo (`output/logs/`)
- Archivos de configuración generados (`output/config/`)
- Reportes de tests (`output/reports/`)

Esta regla es **no negociable** para mantener el proyecto limpio.

## 🔧 SOLUCIONES A PROBLEMAS CONOCIDOS

### Pool de Conexiones MySQL Agotado
**Problema**: "Failed getting connection; pool exhausted"
**Causa**: Conexiones no liberadas correctamente
**Solución implementada en complete_server.py**:
1. Pool aumentado a 10 conexiones
2. Try-finally en TODAS las operaciones de BD
3. Liberación garantizada de cursor y conexión
```python
connection = None
cursor = None
try:
    connection = pool.get_connection()
    cursor = connection.cursor()
    # operaciones
finally:
    if cursor: cursor.close()
    if connection: connection.close()
```

### El servidor NO debe "auto-recuperarse"
- Un servidor bien programado NO necesita recuperación automática
- Si falla, es un BUG que hay que arreglar, no enmascarar
- NO crear loops de reinicio, health checks excesivos, o monitor scripts