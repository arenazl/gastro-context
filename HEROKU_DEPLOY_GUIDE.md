# 🚀 Guía de Deployment a Heroku con Git

## Opción 1: Deploy con Botón de Heroku (Más Fácil)

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

1. Sube tu código a GitHub
2. Ve a tu repositorio en GitHub
3. Agrega este botón al README.md:
   ```markdown
   [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/TU-USUARIO/gastro-context)
   ```
4. Click en el botón y Heroku hará todo automáticamente

## Opción 2: Deploy Manual con Git

### 1️⃣ Crear app en Heroku (desde la web)
1. Ve a [dashboard.heroku.com](https://dashboard.heroku.com)
2. Click en "New" → "Create new app"
3. Nombre: `tu-restaurante-app`
4. Región: United States o Europe

### 2️⃣ Configurar Git Remote
```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "Initial commit"

# Agregar Heroku como remote
git remote add heroku https://git.heroku.com/TU-APP-NAME.git
```

### 3️⃣ Configurar Variables de Entorno
Ve a tu app en Heroku → Settings → Config Vars y agrega:

```
CLEARDB_DATABASE_URL = (se genera automáticamente con el addon)
JWT_SECRET_KEY = tu-clave-secreta-super-segura
CORS_ORIGINS = *
```

### 4️⃣ Agregar Base de Datos
En Resources → Add-ons, busca y agrega:
- **ClearDB MySQL** (gratis hasta 5MB)
- O **JawsDB MySQL** (gratis hasta 5MB)

### 5️⃣ Deploy con Git
```bash
# Push a Heroku
git push heroku main

# Si tu branch es 'master'
git push heroku master:main
```

## Opción 3: GitHub Integration (Auto-Deploy)

### 1️⃣ En Heroku Dashboard
1. Ve a tu app → Deploy tab
2. Deployment method → GitHub
3. Conecta tu cuenta de GitHub
4. Busca tu repositorio: `gastro-context`
5. Click "Connect"

### 2️⃣ Automatic Deploys
1. Enable Automatic Deploys
2. Selecciona branch: `main`
3. Opcionalmente: "Wait for CI to pass"

### 3️⃣ Manual Deploy
1. En la misma página
2. Manual Deploy → Deploy Branch
3. Selecciona `main`
4. Click "Deploy Branch"

## 🔧 Archivos de Configuración Necesarios

Ya están creados en tu proyecto:

✅ **Procfile** - Define cómo iniciar la app
✅ **runtime.txt** - Versión de Python
✅ **requirements.txt** - Dependencias Python
✅ **package.json** - Scripts de build
✅ **app.json** - Configuración de Heroku

## 📝 Verificar el Deployment

### Ver logs:
```bash
# Con Heroku CLI
heroku logs --tail --app TU-APP-NAME

# O desde la web
Dashboard → More → View logs
```

### Abrir la app:
```bash
# Con Heroku CLI
heroku open --app TU-APP-NAME

# O desde la web
Dashboard → Open app
```

## 🔍 Troubleshooting

### Error: "No web processes running"
```bash
heroku ps:scale web=1 --app TU-APP-NAME
```

### Error: "Application error"
1. Revisa los logs
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que la base de datos esté conectada

### Base de datos no conecta
1. Ve a Resources → ClearDB/JawsDB
2. Click en el addon
3. Copia las credenciales
4. Actualiza las variables de entorno

## 🎯 URLs Finales

- **Tu App**: `https://TU-APP-NAME.herokuapp.com`
- **API Docs**: `https://TU-APP-NAME.herokuapp.com/docs`
- **Admin Panel**: `https://dashboard.heroku.com/apps/TU-APP-NAME`