#!/usr/bin/env python3
import mysql.connector

# Configuración de conexión
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'ssl_disabled': False,
    'raise_on_warnings': True
}

connection = mysql.connector.connect(**DB_CONFIG)
cursor = connection.cursor()
cursor.execute("SELECT * FROM tables WHERE id = 1")
row = cursor.fetchone()
columns = [desc[0] for desc in cursor.description]
print("Mesa 1:")
for i, col in enumerate(columns):
    print(f"  {col}: {row[i]}")
cursor.close()
connection.close()