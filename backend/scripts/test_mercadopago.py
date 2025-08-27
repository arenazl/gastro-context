#!/usr/bin/env python3
"""
Script para probar y diagnosticar problemas con MercadoPago
Incluye información sobre tarjetas de prueba y configuración
"""

import mercadopago
import os
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta

# Cargar variables de entorno
load_dotenv()

# Configuración
MP_ACCESS_TOKEN = os.getenv('MP_ACCESS_TOKEN')
MP_PUBLIC_KEY = os.getenv('MP_PUBLIC_KEY')

print("=" * 80)
print("DIAGNÓSTICO DE MERCADOPAGO")
print("=" * 80)

print("\n📌 INFORMACIÓN IMPORTANTE:")
print("-" * 40)
print("Con credenciales APP_USR (producción) debes usar TARJETAS DE PRUEBA")
print("Las tarjetas de prueba permiten simular pagos sin cobros reales")
print("")

print("\n💳 TARJETAS DE PRUEBA PARA ARGENTINA:")
print("-" * 40)
print("VISA (aprobada):")
print("  Número: 4509 9535 6623 3704")
print("  CVV: 123")
print("  Vencimiento: 11/25")
print("  DNI: 12345678")
print("  Nombre: APRO")
print("")
print("MASTERCARD (aprobada):")
print("  Número: 5031 7557 3453 0604") 
print("  CVV: 123")
print("  Vencimiento: 11/25")
print("  DNI: 12345678")
print("  Nombre: APRO")
print("")
print("AMERICAN EXPRESS (aprobada):")
print("  Número: 3711 803032 57522")
print("  CVV: 1234")
print("  Vencimiento: 11/25")
print("  DNI: 12345678")
print("  Nombre: APRO")

print("\n⚠️  ERRORES COMUNES Y SOLUCIONES:")
print("-" * 40)
print("1. Error 404 'AssociateCard':")
print("   - Limpiar caché y cookies del navegador")
print("   - Usar modo incógnito")
print("   - Verificar que el DNI sea válido (8 dígitos)")
print("   - No usar tarjetas reales con credenciales de prueba")
print("")
print("2. Error 'card-token apicall failed':")
print("   - Verificar que estás usando las tarjetas de prueba correctas")
print("   - El CVV debe ser exacto (123 para Visa/MC, 1234 para Amex)")
print("   - La fecha debe ser futura (11/25)")
print("")
print("3. Monto mínimo rechazado:")
print("   - Argentina: mínimo $1.00 ARS")
print("   - No usar centavos en pruebas")

print("\n🔧 VERIFICANDO CONFIGURACIÓN:")
print("-" * 40)

if not MP_ACCESS_TOKEN:
    print("❌ ERROR: MP_ACCESS_TOKEN no está configurado en .env")
else:
    print(f"✅ Access Token: {MP_ACCESS_TOKEN[:20]}...")
    
if not MP_PUBLIC_KEY:
    print("❌ ERROR: MP_PUBLIC_KEY no está configurado en .env")
else:
    print(f"✅ Public Key: {MP_PUBLIC_KEY[:20]}...")

# Determinar tipo de credenciales
if MP_ACCESS_TOKEN and MP_ACCESS_TOKEN.startswith("APP_USR"):
    print("\n📍 Tipo de credenciales: PRODUCCIÓN (APP_USR)")
    print("   ➜ Usar tarjetas de prueba listadas arriba")
    print("   ➜ Los pagos no generarán cobros reales")
    print("   ➜ Usar init_point (NO sandbox_init_point)")
elif MP_ACCESS_TOKEN and MP_ACCESS_TOKEN.startswith("TEST"):
    print("\n📍 Tipo de credenciales: SANDBOX (TEST)")
    print("   ➜ Usar usuarios y tarjetas de prueba de sandbox")
    print("   ➜ Usar sandbox_init_point")
else:
    print("\n⚠️  Tipo de credenciales no reconocido")

print("\n🧪 PROBANDO CREACIÓN DE PREFERENCIA:")
print("-" * 40)

try:
    sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
    
    # Crear una preferencia de prueba
    preference_data = {
        "items": [
            {
                "id": "test-001",
                "title": "Orden de Prueba - Diagnóstico",
                "currency_id": "ARS",
                "quantity": 1,
                "unit_price": 1.00
            }
        ],
        "payer": {
            "name": "Test",
            "surname": "User",
            "email": "test_user_123456@testuser.com",
            "phone": {
                "area_code": "11",
                "number": "12345678"
            },
            "identification": {
                "type": "DNI",
                "number": "12345678"
            }
        },
        "back_urls": {
            "success": "https://gastro.example.com/success",
            "failure": "https://gastro.example.com/failure",
            "pending": "https://gastro.example.com/pending"
        },
        # auto_return removido para evitar validación de URLs
        "payment_methods": {
            "excluded_payment_types": [],
            "excluded_payment_methods": [],
            "installments": 12,
            "default_installments": 1
        },
        "statement_descriptor": "GASTRO TEST",
        "binary_mode": False,
        "marketplace": "NONE"
    }
    
    preference_response = sdk.preference().create(preference_data)
    
    if preference_response["status"] == 201:
        preference = preference_response["response"]
        print("✅ Preferencia creada exitosamente!")
        print(f"   ID: {preference['id']}")
        print(f"   Init Point: {preference.get('init_point', 'N/A')}")
        print(f"   Sandbox Init Point: {preference.get('sandbox_init_point', 'N/A')}")
        
        print("\n🔗 URLs de prueba:")
        print("-" * 40)
        if MP_ACCESS_TOKEN.startswith("APP_USR"):
            print(f"Usar esta URL (producción con tarjetas de prueba):")
            print(f"{preference.get('init_point')}")
        else:
            print(f"Usar esta URL (sandbox):")
            print(f"{preference.get('sandbox_init_point')}")
            
    else:
        print(f"❌ Error creando preferencia: {preference_response['status']}")
        print(json.dumps(preference_response["response"], indent=2))
        
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "=" * 80)
print("RECOMENDACIONES FINALES:")
print("=" * 80)
print("1. Limpiar caché y cookies del navegador")
print("2. Probar en modo incógnito")
print("3. Usar las tarjetas de prueba exactamente como están listadas")
print("4. Si persiste el error, crear una nueva aplicación en MercadoPago")
print("5. Verificar que tu aplicación tenga Checkout Pro habilitado")
print("")
print("Documentación: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/test-integration")