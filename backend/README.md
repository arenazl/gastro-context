# Backend - Sistema Gastronómico

## 🚀 Estructura del Proyecto

```
backend/
├── api/                    # Endpoints de la API REST
├── core/                   # Módulos centrales (auth, cache, database)
├── models/                 # Modelos de base de datos
├── schemas/                # Esquemas Pydantic para validación
├── services/               # Servicios externos (Google Auth, etc)
├── websocket/              # Manejo de WebSockets
├── scripts/                # Scripts de utilidad y migración
├── database/               # Scripts SQL y migraciones
│   └── sql/               # Archivos SQL
├── utils/                  # Utilidades varias (JS, etc)
├── logs/                   # Archivos de log
├── complete_server.py      # ⭐ SERVIDOR PRINCIPAL (puerto 9002)
├── requirements.txt        # Dependencias Python
└── Procfile               # Configuración para Heroku
```

## 📌 Archivo Principal

**`complete_server.py`** - Este es el ÚNICO servidor que se debe usar. Ejecuta en puerto 9002.

## 🔧 Configuración

- **Puerto Backend**: 9002 (INMUTABLE)
- **Base de datos**: MySQL (Aiven)
- **Pool de conexiones**: 10 conexiones configuradas
- **WebSockets**: Habilitados para tiempo real

## 🏃 Iniciar el Servidor

```bash
cd backend
python complete_server.py
```

## 📦 Dependencias

```bash
pip install -r requirements.txt
```

## ⚠️ IMPORTANTE

- **NO crear servidores alternativos** (stable_server.py, robust_server.py, etc.)
- **NO cambiar el puerto 9002** bajo ninguna circunstancia
- **Siempre usar IP de WSL** (172.29.228.80 o similar), no localhost