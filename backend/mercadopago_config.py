import mercadopago
import os
from datetime import datetime, timedelta
import json

# Configuración de MercadoPago
# IMPORTANTE: Reemplazar con tus credenciales de MercadoPago
# Puedes obtenerlas en: https://www.mercadopago.com.ar/developers/panel/credentials
MP_ACCESS_TOKEN = os.getenv('MP_ACCESS_TOKEN', 'TEST-YOUR-ACCESS-TOKEN-HERE')
MP_PUBLIC_KEY = os.getenv('MP_PUBLIC_KEY', 'TEST-YOUR-PUBLIC-KEY-HERE')

# Inicializar SDK
sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

def create_payment_preference(order_data):
    """
    Crea una preferencia de pago en MercadoPago
    
    Args:
        order_data: Diccionario con los datos de la orden
        {
            'order_id': int,
            'items': list,
            'total': float,
            'customer_name': str,
            'customer_email': str,
            'table_number': int
        }
    """
    try:
        # Preparar items para MercadoPago
        items = []
        for item in order_data.get('items', []):
            items.append({
                "id": str(item.get('id', '')),
                "title": item.get('name', 'Producto'),
                "currency_id": "ARS",  # Peso Argentino - cambiar según tu país
                "picture_url": item.get('image_url', ''),
                "description": item.get('description', ''),
                "quantity": item.get('quantity', 1),
                "unit_price": float(item.get('price', 0))
            })
        
        # Crear preferencia
        preference_data = {
            "items": items,
            "payer": {
                "name": order_data.get('customer_name', 'Cliente'),
                "email": order_data.get('customer_email', 'cliente@restaurant.com'),
                "phone": {
                    "area_code": "11",
                    "number": "12345678"
                }
            },
            "back_urls": {
                "success": f"http://172.29.228.80:5173/payment-success?order_id={order_data.get('order_id')}",
                "failure": f"http://172.29.228.80:5173/payment-failure?order_id={order_data.get('order_id')}",
                "pending": f"http://172.29.228.80:5173/payment-pending?order_id={order_data.get('order_id')}"
            },
            "auto_return": "approved",
            "payment_methods": {
                "excluded_payment_types": [],
                "excluded_payment_methods": [],
                "installments": 12  # Máximo de cuotas
            },
            "notification_url": f"http://172.29.228.80:9002/api/webhooks/mercadopago",
            "statement_descriptor": "GASTRO RESTAURANT",
            "external_reference": str(order_data.get('order_id', '')),
            "expires": True,
            "expiration_date_from": datetime.now().isoformat(),
            "expiration_date_to": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        preference_response = sdk.preference().create(preference_data)
        preference = preference_response["response"]
        
        return {
            "success": True,
            "preference_id": preference.get("id"),
            "init_point": preference.get("init_point"),  # URL de checkout
            "sandbox_init_point": preference.get("sandbox_init_point"),  # URL de checkout sandbox
            "public_key": MP_PUBLIC_KEY
        }
        
    except Exception as e:
        print(f"Error creando preferencia de pago: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def get_payment_status(payment_id):
    """
    Obtiene el estado de un pago específico
    """
    try:
        payment = sdk.payment().get(payment_id)
        return payment["response"]
    except Exception as e:
        print(f"Error obteniendo estado del pago: {str(e)}")
        return None

def process_webhook(data):
    """
    Procesa los webhooks de MercadoPago
    """
    try:
        # Verificar tipo de notificación
        if data.get("type") == "payment":
            payment_id = data.get("data", {}).get("id")
            if payment_id:
                payment_info = get_payment_status(payment_id)
                if payment_info:
                    return {
                        "payment_id": payment_id,
                        "status": payment_info.get("status"),
                        "status_detail": payment_info.get("status_detail"),
                        "external_reference": payment_info.get("external_reference"),  # order_id
                        "transaction_amount": payment_info.get("transaction_amount"),
                        "payment_method": payment_info.get("payment_method_id"),
                        "payer_email": payment_info.get("payer", {}).get("email")
                    }
        return None
    except Exception as e:
        print(f"Error procesando webhook: {str(e)}")
        return None