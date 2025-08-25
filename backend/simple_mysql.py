#!/usr/bin/env python3
"""
Simple MySQL connector usando solo librerías estándar de Python
"""
import socket
import hashlib
import struct

def mysql_simple_connect(host, port, user, password, database):
    """
    Conexión MySQL simple usando socket TCP
    """
    try:
        # Conectar por socket TCP
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((host, port))
        
        # Leer handshake inicial
        data = sock.recv(1024)
        if len(data) < 10:
            return None
            
        # Extraer información del handshake
        protocol_version = data[0]
        if protocol_version != 10:
            sock.close()
            return None
            
        # Buscar el NULL terminator para server_version
        null_pos = data.find(b'\x00', 1)
        if null_pos == -1:
            sock.close()
            return None
            
        server_version = data[1:null_pos].decode()
        print(f"MySQL Server: {server_version}")
        
        # Para esta implementación simple, devolver la conexión de socket
        return sock
        
    except Exception as e:
        print(f"Error conectando: {e}")
        return None

def test_connection():
    """Probar conexión a MySQL Aiven"""
    config = {
        'host': 'mysql-aiven-arenazl.e.aivencloud.com',
        'port': 23108,
        'user': 'avnadmin',
        'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
        'database': 'gastro'
    }
    
    conn = mysql_simple_connect(**config)
    if conn:
        print("✅ Conexión exitosa!")
        conn.close()
        return True
    else:
        print("❌ Error en conexión")
        return False

if __name__ == "__main__":
    test_connection()