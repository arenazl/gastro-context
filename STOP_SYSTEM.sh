#!/bin/bash
echo "Deteniendo sistema..."
kill 14867 2>/dev/null
kill 14873 2>/dev/null
pkill -f simple_fastapi_server 2>/dev/null
pkill -f complete_server 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
echo "Sistema detenido"
