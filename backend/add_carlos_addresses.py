#!/usr/bin/env python3
import requests
import json

# URL base del API
BASE_URL = "http://172.29.228.80:9002"

# ID de Juan Carlos
customer_id = 2

# Direcciones de ejemplo para Juan Carlos
addresses = [
    {
        "customer_id": customer_id,
        "address_type": "home",
        "street_address": "Av. Libertador 1234, Piso 5, Depto B",
        "city": "Buenos Aires",
        "state_province": "Buenos Aires",
        "postal_code": "1425",
        "country": "Argentina",
        "latitude": -34.5875,
        "longitude": -58.3772,
        "is_default": True,
        "delivery_instructions": "Tocar timbre 5B. Edificio con portero, decir que va al depto de Pérez",
        "formatted_address": "Av. Libertador 1234, Piso 5, Depto B, Buenos Aires, Argentina",
        "is_active": True
    },
    {
        "customer_id": customer_id,
        "address_type": "work",
        "street_address": "Reconquista 555, Piso 12",
        "city": "Buenos Aires",
        "state_province": "Buenos Aires",
        "postal_code": "1003",
        "country": "Argentina",
        "latitude": -34.6037,
        "longitude": -58.3816,
        "is_default": False,
        "delivery_instructions": "Horario de oficina: 9 a 18hs. Preguntar por Juan Carlos en recepción",
        "formatted_address": "Reconquista 555, Piso 12, Buenos Aires, Argentina",
        "is_active": True
    },
    {
        "customer_id": customer_id,
        "address_type": "other",
        "street_address": "Av. del Golf 200, Country Los Álamos",
        "city": "Pilar",
        "state_province": "Buenos Aires",
        "postal_code": "1629",
        "country": "Argentina",
        "latitude": -34.4587,
        "longitude": -58.9147,
        "is_default": False,
        "delivery_instructions": "Casa de fin de semana. Llamar 30 min antes. Guardia en entrada del country",
        "formatted_address": "Av. del Golf 200, Country Los Álamos, Pilar, Buenos Aires, Argentina",
        "is_active": True
    }
]

# Agregar cada dirección
for i, address in enumerate(addresses, 1):
    print(f"\nAgregando dirección {i} de {len(addresses)}...")
    print(f"  Tipo: {address['address_type']}")
    print(f"  Dirección: {address['street_address']}")
    
    response = requests.post(
        f"{BASE_URL}/api/addresses",
        json=address,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code in [200, 201]:
        print(f"  ✅ Dirección agregada exitosamente")
        result = response.json()
        print(f"  ID: {result.get('id', 'N/A')}")
    else:
        print(f"  ❌ Error al agregar dirección: {response.status_code}")
        print(f"  Respuesta: {response.text}")

print("\n✅ Proceso completado")
print(f"\nPara verificar las direcciones:")
print(f"curl {BASE_URL}/api/customers/{customer_id}/addresses | python3 -m json.tool")