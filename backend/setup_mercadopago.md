# 📱 Guía de Configuración de MercadoPago

## 1. Registro como Desarrollador

### Paso 1: Crear cuenta
1. Ve a https://www.mercadopago.com.ar/developers/es
2. Regístrate o usa tu cuenta existente de MercadoPago
3. Completa tu perfil de desarrollador

### Paso 2: Crear aplicación
1. En el dashboard, click en **"Tus integraciones"**
2. Click en **"Crear aplicación"**
3. Completa:
   - **Nombre**: Sistema Gastronómico POS
   - **Descripción**: Sistema de punto de venta para restaurantes
   - **Modelo de integración**: Checkout Pro
   - **Plataforma**: Web

### Paso 3: Obtener credenciales
En tu aplicación verás:
- **Public Key** (para frontend)
- **Access Token** (para backend)

⚠️ **IMPORTANTE**: Siempre empieza con credenciales de PRUEBA

## 2. Configuración en el Sistema

### Backend
1. Crea un archivo `.env` en `/backend/`:
```bash
MP_ACCESS_TOKEN=TEST-tu-access-token-aqui
MP_PUBLIC_KEY=TEST-tu-public-key-aqui
```

2. Instala el SDK de MercadoPago:
```bash
pip install mercadopago
```

### Frontend
Las credenciales públicas se configurarán automáticamente desde el backend.

## 3. Tarjetas de Prueba

MercadoPago proporciona tarjetas de prueba para testing:

### Tarjetas de APROBACIÓN:
- **Mastercard**: 5031 7557 3453 0604
  - CVV: 123
  - Vencimiento: 11/25
  
- **Visa**: 4509 9535 6623 3704
  - CVV: 123
  - Vencimiento: 11/25

### Tarjetas de RECHAZO:
- **Visa (fondos insuficientes)**: 4000 0000 0000 0002

### Datos de prueba:
- **DNI**: 12345678
- **Email**: test@test.com
- **Nombre**: APRO (para aprobar)
- **Nombre**: OTHE (para rechazar)

## 4. Flujo de Pago

1. Usuario selecciona MercadoPago como método de pago
2. Sistema crea una "preferencia" con los items
3. Se abre el checkout de MercadoPago
4. Usuario completa el pago
5. MercadoPago redirige con el resultado
6. Sistema actualiza el estado de la orden

## 5. Webhooks (Opcional)

Para recibir notificaciones automáticas:
1. En tu app de MercadoPago, configura la URL de webhook:
   ```
   http://tu-dominio.com/api/webhooks/mercadopago
   ```
2. MercadoPago enviará notificaciones de cambios de estado

## 6. Testing

1. Usa siempre credenciales de PRUEBA primero
2. Prueba todos los escenarios:
   - Pago aprobado
   - Pago rechazado
   - Pago pendiente
   - Cancelación

## 7. Ir a Producción

Cuando estés listo:
1. Cambia a credenciales de PRODUCCIÓN
2. Actualiza el archivo `.env`
3. Prueba con montos pequeños primero
4. Verifica que los webhooks funcionen

## Links Útiles

- [Dashboard MercadoPago](https://www.mercadopago.com.ar/developers/panel)
- [Documentación Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Credenciales](https://www.mercadopago.com.ar/developers/panel/app)
- [Tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)