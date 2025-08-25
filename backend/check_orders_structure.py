#!/usr/bin/env python3
import mysql.connector

DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'ssl_disabled': False
}

connection = mysql.connector.connect(**DB_CONFIG)
cursor = connection.cursor()
cursor.execute("DESCRIBE orders")
print("Estructura de la tabla 'orders':")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")
cursor.close()
connection.close()