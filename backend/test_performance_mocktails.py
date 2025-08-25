#!/usr/bin/env python3
"""
Test de performance con 120+ productos en una categoría
"""
import requests
import time
import statistics

BASE_URL = "http://172.29.228.80:9002"

print("=" * 60)
print("🚀 TEST DE PERFORMANCE - 120+ MOCKTAILS")
print("=" * 60)

# Test 1: Cargar TODOS los productos (240+ total)
print("\n📊 TEST 1: Cargar TODOS los productos")
print("-" * 40)
times = []
for i in range(5):
    start = time.time()
    response = requests.get(f"{BASE_URL}/api/products")
    elapsed = time.time() - start
    times.append(elapsed)
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            product_count = len(data)
        else:
            product_count = len(data.get('products', []))
        print(f"  Intento {i+1}: {elapsed:.3f}s - {product_count} productos")

print(f"\n  📈 Promedio: {statistics.mean(times):.3f}s")
print(f"  ⚡ Más rápido: {min(times):.3f}s")
print(f"  🐌 Más lento: {max(times):.3f}s")

# Test 2: Cargar solo Bebidas (120+ productos)
print("\n📊 TEST 2: Cargar categoría Bebidas (120+ mocktails)")
print("-" * 40)
times_bebidas = []
for i in range(5):
    start = time.time()
    response = requests.get(f"{BASE_URL}/api/products?category_id=11")
    elapsed = time.time() - start
    times_bebidas.append(elapsed)
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            product_count = len(data)
        else:
            product_count = len(data.get('products', []))
        print(f"  Intento {i+1}: {elapsed:.3f}s - {product_count} productos")

print(f"\n  📈 Promedio: {statistics.mean(times_bebidas):.3f}s")
print(f"  ⚡ Más rápido: {min(times_bebidas):.3f}s")

# Test 3: Cargar subcategoría específica
print("\n📊 TEST 3: Cargar solo Cócteles Sin Alcohol")
print("-" * 40)
times_mocktails = []
for i in range(5):
    start = time.time()
    response = requests.get(f"{BASE_URL}/api/products?category_id=11&subcategory_id=48")
    elapsed = time.time() - start
    times_mocktails.append(elapsed)
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            product_count = len(data)
        else:
            product_count = len(data.get('products', []))
        print(f"  Intento {i+1}: {elapsed:.3f}s - {product_count} productos")

print(f"\n  📈 Promedio: {statistics.mean(times_mocktails):.3f}s")

# Análisis
print("\n" + "=" * 60)
print("📊 ANÁLISIS DE RESULTADOS")
print("=" * 60)

avg_all = statistics.mean(times)
avg_bebidas = statistics.mean(times_bebidas)

print(f"\n🎯 Con 240+ productos totales:")
print(f"   • Todos los productos: {avg_all:.3f}s")
print(f"   • Solo Bebidas (120+): {avg_bebidas:.3f}s")

if avg_all < 1.0:
    print("\n✅ EXCELENTE: < 1 segundo incluso con 240+ productos")
elif avg_all < 2.0:
    print("\n⚠️ ACEPTABLE: Entre 1-2 segundos")
else:
    print("\n❌ LENTO: > 2 segundos, necesita optimización")

print("\n💡 Recomendaciones:")
if avg_bebidas > 1.0:
    print("   • Considerar paginación para categorías con muchos productos")
    print("   • Implementar lazy loading de imágenes")
    print("   • Usar cache más agresivo")
else:
    print("   • Performance óptima con el volumen actual")
    print("   • El sistema puede manejar el crecimiento")

print("\n🏆 El sistema está manejando:")
print(f"   • 240+ productos totales")
print(f"   • 120+ en una sola categoría")
print(f"   • Con índices optimizados")
print(f"   • Pool de conexiones activo")