# restart-verified.ps1 - Script mejorado con verificación
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   REINICIANDO SISTEMA GASTRONOMICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Detener todo
Write-Host "[1/5] Deteniendo procesos..." -ForegroundColor Red
wsl bash -c "pkill -9 -f 'simple_fastapi_server' 2>/dev/null"
wsl bash -c "pkill -9 -f 'npm run dev' 2>/dev/null"
wsl bash -c "pkill -9 -f 'node.*vite' 2>/dev/null"
wsl bash -c "lsof -ti:9000 | xargs kill -9 2>/dev/null"
wsl bash -c "lsof -ti:5173 | xargs kill -9 2>/dev/null"

Write-Host "[2/5] Limpiando..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# PASO 2: Iniciar Backend
Write-Host "[3/5] Iniciando Backend Python..." -ForegroundColor Green
$backendJob = Start-Process wsl -ArgumentList "bash -c 'cd /mnt/c/Code/gastro-context/backend && python3 simple_fastapi_server.py'" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

# Verificar Backend
Write-Host "[4/5] Verificando Backend..." -ForegroundColor Yellow
$backendTest = wsl bash -c "curl -s http://localhost:9000/health 2>/dev/null"
if ($backendTest -like "*operational*") {
    Write-Host "      Backend OK!" -ForegroundColor Green
} else {
    Write-Host "      Backend NO responde!" -ForegroundColor Red
    Write-Host "      Intentando de nuevo..." -ForegroundColor Yellow
    Start-Process wsl -ArgumentList "bash -c 'cd /mnt/c/Code/gastro-context/backend && python3 simple_fastapi_server.py &'" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# PASO 3: Iniciar Frontend
Write-Host "[5/5] Iniciando Frontend React..." -ForegroundColor Green
$frontendJob = Start-Process wsl -ArgumentList "bash -c 'cd /mnt/c/Code/gastro-context/frontend && npm run dev -- --host 0.0.0.0'" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 4

# Verificar Frontend
$frontendTest = wsl bash -c "curl -s -o /dev/null -w '%{http_code}' http://localhost:5173 2>/dev/null"
if ($frontendTest -eq "200") {
    Write-Host "      Frontend OK!" -ForegroundColor Green
} else {
    Write-Host "      Frontend iniciando..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SISTEMA REINICIADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de Acceso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://172.29.228.80:5173" -ForegroundColor White
Write-Host "   Backend:  http://172.29.228.80:9000" -ForegroundColor White
Write-Host ""
Write-Host "Tambien puedes probar:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:9000" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales:" -ForegroundColor Cyan
Write-Host "   Email: admin@restaurant.com" -ForegroundColor White
Write-Host "   Password: admin" -ForegroundColor White
Write-Host ""
Write-Host "PIDs de los procesos:" -ForegroundColor Gray
if ($backendJob) { Write-Host "   Backend PID: $($backendJob.Id)" -ForegroundColor Gray }
if ($frontendJob) { Write-Host "   Frontend PID: $($frontendJob.Id)" -ForegroundColor Gray }
Write-Host ""
Write-Host "Para ver los logs en tiempo real:" -ForegroundColor Yellow
Write-Host '   wsl bash -c "tail -f /mnt/c/Code/gastro-context/logs/backend.log"' -ForegroundColor White
Write-Host '   wsl bash -c "tail -f /mnt/c/Code/gastro-context/logs/frontend.log"' -ForegroundColor White
Write-Host "========================================"