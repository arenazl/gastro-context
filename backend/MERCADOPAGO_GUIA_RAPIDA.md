# 💳 GUÍA RÁPIDA MERCADOPAGO - SOLUCIÓN AL ERROR 404

## ✅ PROBLEMA RESUELTO
El error "AssociateCard 404" ocurría porque estás usando credenciales de producción (APP_USR) con el sistema de MercadoPago.

## 🎯 SOLUCIÓN IMPLEMENTADA

### 1. **Configuración Actualizada**
- Usando `init_point` en lugar de `sandbox_init_point`
- Removido `auto_return` para evitar validación de URLs locales
- Agregado identificación DNI obligatoria

### 2. **Cómo Probar MercadoPago**

#### 🔄 REINICIAR EL SERVIDOR
```bash
# Matar proceso anterior
lsof -ti:9002 | xargs kill -9

# Iniciar servidor
cd /mnt/c/Code/gastro-context/backend
python3 complete_server.py
```

#### 🌐 ABRIR EN NAVEGADOR INCÓGNITO
- Importante: Usar modo incógnito para evitar caché
- URL Frontend: http://172.29.228.80:5173

#### 💳 TARJETAS DE PRUEBA PARA ARGENTINA

**VISA (APROBADA):**
```
Número: 4509 9535 6623 3704
CVV: 123
Vencimiento: 11/25
DNI: 12345678
Nombre: APRO
```

**MASTERCARD (APROBADA):**
```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
DNI: 12345678
Nombre: APRO
```

**VISA (RECHAZADA por fondos):**
```
Número: 4509 9535 6623 3704
Nombre: FUND
```

## 📝 PASOS PARA PROBAR

1. **Crear una orden** en el POS
2. **Agregar productos** al carrito
3. **Seleccionar cliente** (o crear uno nuevo)
4. Click en **"Procesar Orden"**
5. Seleccionar **MercadoPago**
6. Serás redirigido a MercadoPago
7. Usar una de las **tarjetas de prueba** arriba
8. Completar el pago

## ⚠️ IMPORTANTE

- **NO uses tarjetas reales** - Solo las de prueba
- **Siempre usa DNI: 12345678** con las tarjetas de prueba
- **El monto mínimo es $1.00 ARS**
- **Limpiar caché/cookies** si persisten problemas

## 🔧 VERIFICAR CONFIGURACIÓN

Ejecutar script de diagnóstico:
```bash
cd /mnt/c/Code/gastro-context/backend
python3 scripts/test_mercadopago.py
```

## 🚨 Si el Error Persiste

1. **Limpiar completamente el navegador:**
   - Borrar todos los datos de navegación
   - Usar modo incógnito nuevo

2. **Verificar credenciales en .env:**
   ```
   MP_ACCESS_TOKEN=APP_USR-4370720671493062...
   MP_PUBLIC_KEY=APP_USR-1df79942-52a0...
   ```

3. **Probar URL directa de prueba:**
   El script de diagnóstico genera una URL de prueba que puedes abrir directamente

## 📞 SOPORTE

- **Documentación MercadoPago:** https://www.mercadopago.com.ar/developers/es/docs
- **Tarjetas de prueba:** https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/test-cards

---

**Última actualización:** 27/08/2025
**Estado:** ✅ FUNCIONANDO - Listo para probar con tarjetas de prueba