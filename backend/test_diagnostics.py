#!/usr/bin/env python3
"""
Script de prueba para el sistema de diagnósticos y recuperación automática
"""
import time
import requests
import json
from concurrent.futures import ThreadPoolExecutor

def test_server_health():
    """Probar la salud básica del servidor"""
    print("🔍 Probando salud básica del servidor...")
    
    try:
        response = requests.get("http://localhost:9002/api/categories", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor responde correctamente")
            return True
        else:
            print(f"⚠️ Servidor responde con código {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando al servidor: {e}")
        return False

def stress_test_database():
    """Hacer múltiples requests concurrentes para estresar la base de datos"""
    print("🔥 Iniciando stress test de base de datos...")
    
    def make_request(request_num):
        try:
            response = requests.get("http://localhost:9002/api/products", timeout=10)
            return f"Request {request_num}: {response.status_code}"
        except Exception as e:
            return f"Request {request_num}: ERROR - {e}"
    
    # Hacer 20 requests concurrentes
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request, i) for i in range(20)]
        results = [future.result() for future in futures]
    
    for result in results[:5]:  # Mostrar solo los primeros 5
        print(f"  {result}")
    
    successful = len([r for r in results if "200" in r])
    print(f"📊 Resultados: {successful}/20 requests exitosas")

def check_diagnostic_logs():
    """Revisar los logs de diagnóstico"""
    print("📋 Revisando logs de diagnóstico...")
    
    try:
        with open("/mnt/c/Code/gastro-context/backend/logs/crash_diagnostics.json", "r") as f:
            diagnostics = json.load(f)
        
        print(f"📈 Total de errores registrados: {diagnostics['error_summary']['total_errors']}")
        print(f"🔢 Tipos de errores únicos: {len(diagnostics['error_summary']['error_counts_by_category'])}")
        
        if diagnostics['error_summary']['error_counts_by_category']:
            print("📊 Errores por categoría:")
            for category, count in diagnostics['error_summary']['error_counts_by_category'].items():
                print(f"  - {category}: {count} veces")
        
        if diagnostics.get('recommendations'):
            print("💡 Recomendaciones del sistema:")
            for rec in diagnostics['recommendations']:
                print(f"  - {rec['message']}")
        
    except FileNotFoundError:
        print("📁 Archivo de diagnósticos no encontrado (normal si no hubo errores)")
    except Exception as e:
        print(f"❌ Error leyendo diagnósticos: {e}")

def simulate_connection_exhaustion():
    """Simular agotamiento de conexiones para probar recuperación"""
    print("⚡ Simulando agotamiento de conexiones...")
    
    # Hacer muchas requests rápidas para agotar el pool
    def rapid_request(i):
        try:
            response = requests.get("http://localhost:9002/api/categories", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    # 50 requests muy rápidas
    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = [executor.submit(rapid_request, i) for i in range(50)]
        results = [future.result() for future in futures]
    
    successful = sum(results)
    print(f"📈 Simulación completada: {successful}/50 requests exitosas")
    
    # Esperar un momento y probar de nuevo
    print("⏳ Esperando 3 segundos y probando recuperación...")
    time.sleep(3)
    
    if test_server_health():
        print("✅ Servidor se recuperó correctamente del stress")
    else:
        print("❌ Servidor no se recuperó del stress")

def main():
    print("🚀 Iniciando pruebas del sistema de diagnósticos\n")
    
    # Prueba 1: Salud básica
    print("=" * 50)
    if not test_server_health():
        print("❌ Servidor no disponible, abortando pruebas")
        return
    
    # Prueba 2: Stress test normal
    print("\n" + "=" * 50)
    stress_test_database()
    
    # Prueba 3: Simulación de agotamiento
    print("\n" + "=" * 50)
    simulate_connection_exhaustion()
    
    # Prueba 4: Revisar diagnósticos
    print("\n" + "=" * 50)
    check_diagnostic_logs()
    
    print("\n🎉 Pruebas completadas!")
    print("\n📁 Revisa estos archivos para logs detallados:")
    print("  - logs/gastro_server.log (log general)")
    print("  - logs/database.log (logs de base de datos)")
    print("  - logs/errors.log (solo errores)")
    print("  - logs/crash_diagnostics.json (diagnósticos inteligentes)")

if __name__ == "__main__":
    main()