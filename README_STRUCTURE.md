# 📁 Estructura del Proyecto - Sistema Gastronómico

## 🗂️ Organización de Carpetas

```
gastro-context/
├── backend/               # 🔧 Servidor FastAPI (Puerto 9002)
│   ├── api/              # Endpoints REST
│   ├── core/             # Módulos centrales
│   ├── models/           # Modelos de BD
│   ├── database/         # Scripts SQL y migraciones
│   ├── scripts/          # Scripts de utilidad
│   └── complete_server.py # ⭐ SERVIDOR PRINCIPAL
│
├── frontend/             # 🎨 Aplicación React + Vite (Puerto 5173)
│   ├── src/             # Código fuente
│   ├── public/          # Archivos públicos
│   └── dist/            # Build de producción
│
├── docs/                # 📚 Documentación
│   ├── setup/          # Guías de instalación
│   ├── deployment/     # Guías de deployment
│   ├── guides/         # Guías generales
│   └── research/       # Investigación y patrones
│
├── scripts/            # 🔨 Scripts del sistema
│   ├── startup/        # Scripts de inicio
│   ├── deployment/     # Scripts de deploy
│   ├── database/       # Scripts de BD
│   └── maintenance/    # Scripts de mantenimiento
│
├── uploads/           # 📤 Archivos subidos
├── logs/              # 📝 Archivos de log
├── PRPs/              # 📋 Project Requirement Papers
│
├── CLAUDE.md          # ⚙️ Configuración del agente
├── version.json       # 🏷️ Versión del sistema
├── package.json       # Dependencias Node.js
├── requirements.txt   # Dependencias Python
├── docker-compose.yml # 🐳 Configuración Docker
└── Procfile          # Configuración Heroku
```

## 🚨 Reglas Críticas

### Puertos (INMUTABLES)
- **Backend**: 9002
- **Frontend**: 5173

### Servidor Principal
- **ÚNICO servidor**: `backend/complete_server.py`
- **NO crear** servidores alternativos

### Base de Datos
- **MySQL** con pool de 10 conexiones
- Conexiones siempre liberadas con try-finally

## 🚀 Iniciar el Sistema

```bash
# Backend
cd backend
python complete_server.py

# Frontend
cd frontend
npm run dev
```

## 📌 Archivos Importantes en Raíz

Solo estos archivos deben estar en el raíz:

- **CLAUDE.md**: Configuración del agente
- **README.md**: Documentación principal
- **version.json**: Control de versiones
- **package.json**: Dependencias Node.js
- **requirements.txt**: Dependencias Python
- **docker-compose.yml**: Docker
- **Procfile**: Heroku
- **.githooks/**: Hooks de Git
- **.gitignore**: Archivos ignorados

Todo lo demás debe estar en carpetas organizadas.