# restart.ps1 - Script para reiniciar el sistema gastronomico desde PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   REINICIANDO SISTEMA GASTRONOMICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deteniendo todo..." -ForegroundColor Red
wsl bash -c "lsof -ti:9000 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null; pkill -f 'npm run dev'; pkill -f simple_fastapi_server"

Write-Host "Esperando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Iniciando Backend Python..." -ForegroundColor Green
wsl bash -c "cd /mnt/c/Code/gastro-context/backend && python3 simple_fastapi_server.py > ../logs/backend.log 2>&1 &"

Write-Host "Esperando que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Iniciando Frontend React..." -ForegroundColor Green
wsl bash -c "cd /mnt/c/Code/gastro-context/frontend && npm run dev -- --host 0.0.0.0 > ../logs/frontend.log 2>&1 &"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SISTEMA REINICIADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de Acceso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://172.29.228.80:5173" -ForegroundColor White
Write-Host "   Backend:  http://172.29.228.80:9000" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales:" -ForegroundColor Cyan
Write-Host "   Email: admin@restaurant.com" -ForegroundColor White
Write-Host "   Password: admin" -ForegroundColor White
Write-Host ""
Write-Host "Logs disponibles en:" -ForegroundColor Gray
Write-Host "   /mnt/c/Code/gastro-context/logs/backend.log" -ForegroundColor Gray
Write-Host "   /mnt/c/Code/gastro-context/logs/frontend.log" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener todo, ejecuta:" -ForegroundColor Yellow
Write-Host '   wsl bash -c "pkill -f npm; pkill -f python"' -ForegroundColor White
Write-Host "========================================"