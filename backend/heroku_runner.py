#!/usr/bin/env python3
"""
Runner para Heroku que inicia el servidor complete_server.py correctamente
"""
import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importar y ejecutar el servidor
from complete_server import *

if __name__ == "__main__":
    # El servidor ya se ejecuta automáticamente al importarlo
    pass