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

def update_positions():
    try:
        # Conectar a la base de datos
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Actualizar posiciones iniciales para distribución visual
        cursor.execute("""
            UPDATE tables 
            SET x = 100 + ((id - 1) % 5) * 150,
                y = 100 + FLOOR((id - 1) / 5) * 150
            WHERE x = 100 AND y = 100
        """)
        
        rows_updated = cursor.rowcount
        connection.commit()
        
        print(f"✅ {rows_updated} mesas actualizadas con posiciones distribuidas")
        
        # Verificar las nuevas posiciones
        cursor.execute("SELECT id, number, x, y FROM tables ORDER BY id LIMIT 10")
        print("\nPrimeras 10 mesas:")
        for row in cursor.fetchall():
            print(f"  Mesa #{row[1]} (ID {row[0]}): x={row[2]}, y={row[3]}")
        
        cursor.close()
        connection.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Error MySQL: {err}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    update_positions()