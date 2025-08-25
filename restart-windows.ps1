# restart-windows.ps1 - Abre ventanas separadas para ver el output
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   REINICIANDO SISTEMA GASTRONOMICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Matar todo
Write-Host "Deteniendo procesos anteriores..." -ForegroundColor Red
wsl bash -c "pkill -9 -f simple_fastapi_server 2>/dev/null"
wsl bash -c "pkill -9 -f 'npm run dev' 2>/dev/null"
wsl bash -c "pkill -9 -f node 2>/dev/null"
wsl bash -c "pkill -9 -f python3 2>/dev/null"

Write-Host "Esperando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# PASO 2: Crear directorio de logs si no existe
wsl bash -c "mkdir -p /mnt/c/Code/gastro-context/logs"

# PASO 3: Iniciar Backend en nueva ventana
Write-Host "Iniciando Backend en nueva ventana..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host 'BACKEND PYTHON - Puerto 9000' -ForegroundColor Cyan
Write-Host '=============================' -ForegroundColor Cyan
wsl bash -c 'cd /mnt/c/Code/gastro-context/backend && python3 simple_fastapi_server.py'
"@

Write-Host "Esperando que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# PASO 4: Iniciar Frontend en nueva ventana
Write-Host "Iniciando Frontend en nueva ventana..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host 'FRONTEND REACT - Puerto 5173' -ForegroundColor Cyan
Write-Host '=============================' -ForegroundColor Cyan
wsl bash -c 'cd /mnt/c/Code/gastro-context/frontend && npm run dev -- --host 0.0.0.0'
"@

Write-Host "Esperando que el frontend compile..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# PASO 5: Verificar que todo funcione
Write-Host ""
Write-Host "Verificando servicios..." -ForegroundColor Yellow

$backendOk = $false
$frontendOk = $false

# Test Backend
try {
    $response = Invoke-WebRequest -Uri "http://172.29.228.80:9000/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "   Backend: OK (Puerto 9000)" -ForegroundColor Green
        $backendOk = $true
    }
} catch {
    Write-Host "   Backend: NO RESPONDE" -ForegroundColor Red
}

# Test Frontend
try {
    $response = Invoke-WebRequest -Uri "http://172.29.228.80:5173" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "   Frontend: OK (Puerto 5173)" -ForegroundColor Green
        $frontendOk = $true
    }
} catch {
    Write-Host "   Frontend: NO RESPONDE (puede tardar mas)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SISTEMA INICIADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se abrieron 2 ventanas de PowerShell:" -ForegroundColor Cyan
Write-Host "   1. Backend (Python)" -ForegroundColor White
Write-Host "   2. Frontend (React)" -ForegroundColor White
Write-Host ""
Write-Host "URLs de Acceso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://172.29.228.80:5173" -ForegroundColor White
Write-Host "   Backend:  http://172.29.228.80:9000" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales:" -ForegroundColor Cyan
Write-Host "   Email: admin@restaurant.com" -ForegroundColor White
Write-Host "   Password: admin" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - NO cierres las ventanas de PowerShell" -ForegroundColor White
Write-Host "   - Para detener, cierra las ventanas o Ctrl+C" -ForegroundColor White
Write-Host "========================================"