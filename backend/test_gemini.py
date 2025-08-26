#!/usr/bin/env python3
"""
Script de test para probar Gemini AI con logging detallado
"""

import logging
import json
import time

# Configurar logging detallado
logging.basicConfig(
    level=logging.DEBUG,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def test_gemini():
    """Probar Gemini paso a paso con logging"""
    
    logger.info("=" * 60)
    logger.info("🚀 INICIANDO TEST DE GEMINI AI")
    logger.info("=" * 60)
    
    # PASO 1: Importar librería
    try:
        logger.info("📦 PASO 1: Importando google.generativeai...")
        import google.generativeai as genai
        logger.info("✅ Librería importada exitosamente")
    except ImportError as e:
        logger.error(f"❌ ERROR: No se pudo importar: {e}")
        logger.error("   Instala con: pip install google-generativeai")
        return False
    except Exception as e:
        logger.error(f"❌ ERROR INESPERADO: {e}")
        return False
    
    # PASO 2: Configurar API Key
    try:
        logger.info("\n🔑 PASO 2: Configurando API Key...")
        api_key = 'AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM'
        logger.debug(f"   API Key: {api_key[:10]}...")
        genai.configure(api_key=api_key)
        logger.info("✅ API Key configurada correctamente")
    except Exception as e:
        logger.error(f"❌ ERROR configurando API: {e}")
        return False
    
    # PASO 3: Crear modelo
    try:
        logger.info("\n🤖 PASO 3: Creando modelo Gemini...")
        model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("✅ Modelo creado exitosamente")
    except Exception as e:
        logger.error(f"❌ ERROR creando modelo: {e}")
        return False
    
    # PASO 4: Probar con un prompt simple
    try:
        logger.info("\n💬 PASO 4: Probando prompt simple...")
        test_prompt = "Di 'Hola, estoy funcionando' en 5 palabras"
        logger.debug(f"   Prompt: '{test_prompt}'")
        
        start_time = time.time()
        response = model.generate_content(test_prompt)
        elapsed = time.time() - start_time
        
        logger.info(f"✅ Respuesta recibida en {elapsed:.2f} segundos")
        logger.info(f"   Respuesta: '{response.text}'")
    except Exception as e:
        logger.error(f"❌ ERROR generando contenido: {e}")
        logger.error(f"   Tipo: {type(e).__name__}")
        import traceback
        logger.error(f"   Traceback:\n{traceback.format_exc()}")
        return False
    
    # PASO 5: Probar con un prompt JSON (como el de la app)
    try:
        logger.info("\n🔄 PASO 5: Probando con prompt JSON...")
        json_prompt = """
        Analiza este mensaje y responde en JSON:
        
        Mensaje: "Hola, ¿qué tal?"
        
        Responde SOLO con este JSON:
        {
          "intent_type": "greeting",
          "confidence": 100,
          "response": "tu respuesta aquí"
        }
        """
        
        logger.debug("   Enviando prompt para respuesta JSON...")
        response = model.generate_content(json_prompt)
        logger.info(f"✅ Respuesta JSON recibida")
        logger.debug(f"   Raw response: {response.text}")
        
        # Intentar parsear JSON
        import re
        json_match = re.search(r'\{.*?\}', response.text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            logger.info(f"✅ JSON parseado correctamente:")
            logger.info(f"   Intent: {parsed.get('intent_type')}")
            logger.info(f"   Confidence: {parsed.get('confidence')}")
            logger.info(f"   Response: {parsed.get('response')}")
        else:
            logger.warning("⚠️ No se pudo extraer JSON de la respuesta")
            
    except Exception as e:
        logger.error(f"❌ ERROR en prueba JSON: {e}")
        import traceback
        logger.error(f"   Traceback:\n{traceback.format_exc()}")
        return False
    
    # RESUMEN FINAL
    logger.info("\n" + "=" * 60)
    logger.info("✅ ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!")
    logger.info("   Gemini AI está funcionando correctamente")
    logger.info("=" * 60)
    
    return True

if __name__ == "__main__":
    # Ejecutar test
    success = test_gemini()
    
    if not success:
        logger.error("\n❌ El test falló. Revisa los errores arriba.")
        exit(1)
    else:
        logger.info("\n🎉 ¡Todo funcionando perfectamente!")
        
        # Probar mensaje interactivo
        logger.info("\n📝 Prueba interactiva (presiona Ctrl+C para salir):")
        try:
            import google.generativeai as genai
            genai.configure(api_key='AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM')
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            while True:
                user_msg = input("\n👤 Tu mensaje: ")
                if user_msg.lower() in ['salir', 'exit', 'quit']:
                    break
                    
                logger.info(f"🔄 Procesando: '{user_msg}'...")
                response = model.generate_content(user_msg)
                print(f"🤖 Gemini: {response.text}")
                
        except KeyboardInterrupt:
            logger.info("\n👋 ¡Hasta luego!")
        except Exception as e:
            logger.error(f"Error: {e}")