# 📚 Guía de Deployment - Sistema Gastronómico

## 🚀 Opción 1: Heroku (Recomendado para comenzar)

### Requisitos previos:
1. Cuenta en Heroku (https://heroku.com)
2. Heroku CLI instalado
3. Base de datos MySQL externa (Aiven, PlanetScale, etc.)

### Pasos de deployment:

#### 1️⃣ Configurar base de datos MySQL:
- Crear cuenta en Aiven (https://aiven.io) o PlanetScale
- Crear base de datos MySQL
- Guardar credenciales

#### 2️⃣ Configurar variables en el script:
Editar `deploy-heroku.sh` y actualizar:
```bash
MYSQL_HOST="tu-host-mysql.aivencloud.com"
MYSQL_USER="tu-usuario"
MYSQL_PASSWORD="tu-password"
MYSQL_DATABASE="gastro_db"
```

#### 3️⃣ Ejecutar deployment:
```bash
./deploy-heroku.sh
```

### Costos estimados:
- **Heroku**: $7/mes por dyno (backend + frontend = $14/mes)
- **MySQL Aiven**: Desde $19/mes
- **Total**: ~$33/mes

---

## 🚀 Opción 2: Railway (Más simple)

### Pasos:
1. Ir a https://railway.app
2. Conectar con GitHub
3. Deploy directo desde el repo
4. Railway detecta automáticamente FastAPI y React

### Ventajas:
- Deploy automático con cada push
- MySQL incluido
- SSL gratis
- Logs en tiempo real

### Costos:
- Plan Hobby: $5/mes (incluye $5 de créditos)
- MySQL: Incluido

---

## 🚀 Opción 3: Vercel (Frontend) + Railway (Backend)

### Frontend en Vercel:
```bash
cd frontend
npm i -g vercel
vercel
```

### Backend en Railway:
- Deploy desde GitHub
- Configurar variables de entorno

### Ventajas:
- Vercel gratis para frontend
- Mejor performance global
- Preview deployments automáticos

### Costos:
- **Vercel**: Gratis (plan hobby)
- **Railway**: $5/mes
- **Total**: $5/mes

---

## 🚀 Opción 4: DigitalOcean App Platform

### Ventajas:
- Todo en un lugar
- Escalamiento automático
- Base de datos administrada

### Pasos:
1. Crear app en DigitalOcean
2. Conectar GitHub
3. Configurar build commands:
   - Backend: `pip install -r requirements.txt`
   - Frontend: `npm install && npm run build`

### Costos:
- Basic: $5/mes por componente
- MySQL administrado: $15/mes
- Total: ~$25/mes

---

## 🔧 Variables de Entorno Necesarias

### Backend:
```env
MYSQL_HOST=xxx
MYSQL_USER=xxx
MYSQL_PASSWORD=xxx
MYSQL_DATABASE=gastro_db
MYSQL_PORT=3306
CORS_ORIGINS=https://tu-frontend.com
JWT_SECRET_KEY=xxx
STRIPE_SECRET_KEY=xxx
```

### Frontend:
```env
VITE_API_URL=https://tu-backend.herokuapp.com
VITE_WS_URL=wss://tu-backend.herokuapp.com
```

---

## 📝 Checklist Pre-Deployment

- [ ] Base de datos MySQL configurada
- [ ] Variables de entorno definidas
- [ ] Dominio personalizado (opcional)
- [ ] SSL configurado
- [ ] Stripe en modo producción
- [ ] Tests ejecutados
- [ ] Backup de base de datos

---

## 🚨 Post-Deployment

1. **Monitoreo:**
   - Configurar alertas en Heroku/Railway
   - Revisar logs regularmente

2. **Backups:**
   - Configurar backups automáticos de BD
   - Guardar snapshots antes de updates

3. **Escalamiento:**
   - Monitorear uso de recursos
   - Escalar dynos según demanda

---

## 💡 Tips para Producción

1. **Optimización de imágenes:**
   - Usar CDN como Cloudinary
   - Comprimir imágenes antes de subir

2. **Cache:**
   - Habilitar Redis para cache
   - Configurar cache de navegador

3. **Seguridad:**
   - Usar HTTPS siempre
   - Configurar rate limiting
   - Validar todos los inputs

4. **Performance:**
   - Lazy loading en frontend
   - Paginación en listados
   - Índices en base de datos