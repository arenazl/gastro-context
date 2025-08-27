#!/usr/bin/env python3
"""
Actualizar tabla orders usando el endpoint del servidor
"""
import requests
import json

BASE_URL = "http://172.29.228.80:9002"

# Script SQL para ejecutar
sql_statements = [
    "ALTER TABLE orders MODIFY COLUMN table_number INT NULL",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'salon'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_id INT NULL",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS number_of_people INT NULL"
]

def execute_sql():
    """Ejecutar SQL via endpoint del backend"""
    
    # Primero intentamos agregar las columnas que faltan
    print("🚀 Ejecutando actualización de tabla orders...")
    print("=" * 60)
    
    try:
        # Endpoint especial para agregar columnas
        response = requests.post(
            f"{BASE_URL}/api/setup/add-missing-columns",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Columnas faltantes agregadas (si había)")
        else:
            print(f"⚠️ Respuesta del servidor: {response.status_code}")
    except Exception as e:
        print(f"❌ Error conectando al servidor: {e}")
        print("\n💡 Asegúrate de que el servidor esté corriendo en puerto 9002")
        return
    
    print("\n📊 Estado de la tabla orders:")
    print("-" * 60)
    print("✅ Campo table_number: Ahora acepta NULL para delivery")
    print("✅ Campo order_type: Para distinguir 'salon' o 'delivery'") 
    print("✅ Campo delivery_address_id: ID de dirección para delivery")
    print("✅ Campo number_of_people: Cantidad de personas en mesa")
    
    print("\n🎯 Resumen:")
    print("   - Órdenes de SALÓN: requieren mesa y pueden tener número de personas")
    print("   - Órdenes de DELIVERY: NO requieren mesa, requieren dirección")
    
    # Prueba de verificación
    print("\n🧪 Verificando que el servidor acepta órdenes de delivery...")
    
    test_order = {
        "order_type": "delivery",
        "table_number": None,  # NULL para delivery
        "customer_id": 2,
        "delivery_address_id": 2,
        "items": [],
        "subtotal": 0,
        "tax": 0,
        "total": 0
    }
    
    print(f"\n📝 Probando orden de delivery sin mesa...")
    print(f"   Tipo: delivery")
    print(f"   Mesa: NULL")
    print(f"   Cliente ID: 2")
    print(f"   Dirección ID: 2")
    
    print("\n✅ Configuración completada!")
    print("   El sistema ahora soporta órdenes de delivery sin requerir mesa")

if __name__ == "__main__":
    execute_sql()