# ✅ SISTEMA FUNCIONANDO - GUÍA DE ACCESO DESDE WINDOWS

## 🎯 URLs PARA ACCEDER DESDE TU NAVEGADOR WINDOWS:

### Opción 1: Usar IP de WSL (RECOMENDADO)
```
Frontend: http://172.29.228.80:5173
Backend:  http://172.29.228.80:9000
```

### Opción 2: Si configuraste el port forwarding
```
Frontend: http://localhost:5173
Backend:  http://localhost:9000
```

## 🔑 CREDENCIALES DE LOGIN:
- **Email:** admin@restaurant.com
- **Password:** admin

## ✅ VERIFICACIÓN DE FUNCIONAMIENTO:

1. **Backend está funcionando** ✅
   - Prueba: http://172.29.228.80:9000/health
   - Respuesta: `{"name": "Restaurant Management System", "version": "1.0.0", "status": "operational"}`

2. **Frontend está funcionando** ✅
   - URL: http://172.29.228.80:5173
   - Te redirigirá a /login

## 📝 PASOS PARA USAR EL SISTEMA:

1. Abre tu navegador en Windows (Chrome, Edge, Firefox)
2. Ve a: **http://172.29.228.80:5173**
3. Serás redirigido a la página de login
4. Ingresa:
   - Email: admin@restaurant.com
   - Password: admin
5. ¡Listo! Ya puedes usar el sistema

## 🔧 SI NO FUNCIONA localhost:

Es normal en WSL. Windows y WSL tienen redes separadas. Usa siempre la IP 172.29.228.80

Para hacer que localhost funcione, ejecuta esto en PowerShell como Administrador:
```powershell
netsh interface portproxy add v4tov4 listenport=9000 listenaddress=0.0.0.0 connectport=9000 connectaddress=172.29.228.80
netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=172.29.228.80
```

## 🚀 COMANDOS ÚTILES:

### Para iniciar el sistema:
```bash
# Backend
cd /mnt/c/Code/gastro-context/backend
python3 simple_fastapi_server.py

# Frontend (en otra terminal)
cd /mnt/c/Code/gastro-context/frontend
npm run dev -- --host 0.0.0.0
```

### Para verificar que funciona:
```bash
curl http://172.29.228.80:9000/health
curl http://172.29.228.80:5173
```

## ✅ ESTADO ACTUAL:
- **Backend**: ✅ FUNCIONANDO en puerto 9000
- **Frontend**: ✅ FUNCIONANDO en puerto 5173
- **Base de datos**: ✅ Simulada (desarrollo)
- **Login**: ✅ FUNCIONANDO
- **API**: ✅ Conectada correctamente

---
**IMPORTANTE**: Usa la IP 172.29.228.80 en lugar de localhost cuando accedas desde Windows.