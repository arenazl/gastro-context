#!/usr/bin/env python3
"""
Test de performance del servidor actual con pool
"""
import requests
import time
import statistics

# URL del backend actual
BASE_URL = "http://172.29.228.80:9002"

def test_products_endpoint():
    """Probar el endpoint de productos múltiples veces"""
    
    print("=" * 60)
    print("🧪 TEST DE PERFORMANCE - ENDPOINT PRODUCTOS")
    print("=" * 60)
    
    times = []
    
    for i in range(10):
        start = time.time()
        
        # Llamar al endpoint de productos
        response = requests.get(f"{BASE_URL}/api/products?category_id=1")
        
        elapsed = time.time() - start
        times.append(elapsed)
        
        if response.status_code == 200:
            data = response.json()
            # El endpoint devuelve directamente una lista de productos
            if isinstance(data, list):
                product_count = len(data)
            else:
                product_count = len(data.get('products', []))
            print(f"Llamado {i+1}: {elapsed:.3f}s - {product_count} productos")
        else:
            print(f"Llamado {i+1}: ERROR - Status {response.status_code}")
    
    print("\n📊 ESTADÍSTICAS:")
    print(f"  🥶 Primer llamado (cold start): {times[0]:.3f}s")
    print(f"  🔥 Promedio llamados 2-10: {statistics.mean(times[1:]):.3f}s")
    print(f"  ⚡ Llamado más rápido: {min(times):.3f}s")
    print(f"  🐌 Llamado más lento: {max(times):.3f}s")
    print(f"  📈 Mejora después del primero: {(times[0] - statistics.mean(times[1:])) / times[0] * 100:.1f}%")
    
    # Análisis
    print("\n🎯 ANÁLISIS:")
    if times[0] > 3:
        print("  ❌ El primer llamado es MUY lento (> 3s)")
        print("  💡 Solución: Implementar precalentamiento del pool al iniciar")
    elif times[0] > 1:
        print("  ⚠️ El primer llamado es lento (> 1s)")
        print("  💡 Solución: Precargar cache al arrancar el servidor")
    else:
        print("  ✅ El primer llamado es aceptable")
    
    avg_subsequent = statistics.mean(times[1:])
    if avg_subsequent > 1:
        print(f"  ❌ Los llamados subsiguientes son lentos ({avg_subsequent:.3f}s)")
        print("  💡 Problema: Alta latencia con BD o pool mal configurado")
    elif avg_subsequent > 0.5:
        print(f"  ⚠️ Los llamados subsiguientes podrían ser más rápidos ({avg_subsequent:.3f}s)")
        print("  💡 Solución: Implementar cache más agresivo")
    else:
        print(f"  ✅ Los llamados subsiguientes son rápidos ({avg_subsequent:.3f}s)")

def test_categories_endpoint():
    """Probar endpoint de categorías (debería estar cacheado)"""
    print("\n" + "=" * 60)
    print("🧪 TEST DE PERFORMANCE - ENDPOINT CATEGORÍAS")
    print("=" * 60)
    
    times = []
    
    for i in range(5):
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/categories")
        elapsed = time.time() - start
        times.append(elapsed)
        print(f"Llamado {i+1}: {elapsed:.3f}s")
    
    print(f"\n📊 Promedio: {statistics.mean(times):.3f}s")

if __name__ == "__main__":
    print("🚀 Iniciando tests de performance...")
    print(f"🔗 Backend: {BASE_URL}")
    print()
    
    # Test principal
    test_products_endpoint()
    
    # Test secundario
    test_categories_endpoint()
    
    print("\n" + "=" * 60)
    print("✅ TESTS COMPLETADOS")
    print("=" * 60)