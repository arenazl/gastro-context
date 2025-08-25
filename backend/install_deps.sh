#!/bin/bash
# Script para instalar dependencias necesarias

echo "📦 Instalando dependencias para el servidor..."

# Descargar get-pip.py si no existe
if [ ! -f get-pip.py ]; then
    echo "Descargando pip..."
    curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py
fi

# Instalar pip
echo "Instalando pip..."
python3 get-pip.py --user

# Agregar pip al PATH
export PATH=$PATH:$HOME/.local/bin

# Instalar dependencias
echo "Instalando PyMySQL..."
python3 -m pip install --user pymysql

echo "Instalando SQLAlchemy..."
python3 -m pip install --user sqlalchemy

echo "✅ Dependencias instaladas"