# Research Directory - Sistema Gastronómico

Esta carpeta contiene toda la documentación oficial scrapeada automáticamente durante el proceso de **Context Engineering**.

## 🔍 Cómo Funciona la Investigación Automática

Cuando ejecutas `/generate-prp INITIAL.md`, el framework:

1. **Lee los links** de documentación en `INITIAL.md`
2. **Scrapea automáticamente** 30-100+ páginas oficiales usando Jina AI
3. **Organiza por tecnología** en subdirectorios
4. **Combina con examples/** para generar código perfecto

## 📁 Estructura Esperada Después de Research

```
research/
├── fastapi/                 # 15-20 páginas de FastAPI docs
│   ├── tutorial-basics.md
│   ├── websockets.md
│   ├── security.md
│   ├── database.md
│   └── testing.md
├── postgresql/              # 10-15 páginas PostgreSQL
│   ├── tutorial.md
│   ├── indexes.md
│   ├── transactions.md
│   └── performance.md
├── nextjs/                  # 15-20 páginas Next.js
│   ├── getting-started.md
│   ├── routing.md
│   ├── api-routes.md
│   └── deployment.md
├── react/                   # 10-15 páginas React
│   ├── hooks.md
│   ├── components.md
│   ├── state-management.md
│   └── performance.md
├── tailwind/                # 5-10 páginas Tailwind CSS
│   ├── installation.md
│   ├── responsive-design.md
│   └── components.md
├── stripe/                  # 15-20 páginas Stripe
│   ├── payments.md
│   ├── webhooks.md
│   ├── testing.md
│   └── security.md
├── sqlalchemy/              # 10-15 páginas SQLAlchemy
│   ├── orm-tutorial.md
│   ├── relationships.md
│   ├── migrations.md
│   └── async.md
└── pydantic/                # 5-10 páginas Pydantic
    ├── models.md
    ├── validation.md
    └── settings.md
```

## 🎯 URLs que se Scrapearan Automáticamente

### **Backend & Database**
- https://fastapi.tiangolo.com/tutorial/first-steps/
- https://fastapi.tiangolo.com/advanced/websockets/
- https://docs.sqlalchemy.org/en/20/
- https://www.postgresql.org/docs/current/tutorial.html
- https://docs.pydantic.dev/latest/

### **Frontend**  
- https://nextjs.org/docs/getting-started
- https://react.dev/learn
- https://tailwindcss.com/docs
- https://headlessui.com/

### **Pagos y Servicios**
- https://stripe.com/docs/api
- https://stripe.com/docs/payments
- https://stripe.com/docs/webhooks

### **PWA y Mobile**
- https://web.dev/progressive-web-apps/
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

## ✨ Ventajas del Research Automático

### **📚 Información Actualizada**
- Documentación oficial más reciente
- No tutorials outdated de hace 2 años
- Ejemplos que realmente funcionan

### **🧠 Context Rico para IA** 
- 50-100+ páginas de context real
- Patrones oficiales, no inventados
- Código production-ready desde el inicio

### **🎯 Específico para Tu Proyecto**
- Solo la documentación que necesitas
- Organizada por feature que estás construyendo
- Referencias cruzadas entre tecnologías

## 🚀 Ejemplo de Contenido Scrapeado

### **fastapi/tutorial-basics.md**
```markdown
# FastAPI Tutorial - First Steps

## Create your first API

Create a file main.py with:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def read_root():
    return {"Hello": "World"}
```

## Run the server

Use uvicorn to run the server:

```bash
uvicorn main:app --reload
```

[Contenido completo scrapeado de la documentación oficial...]
```

### **stripe/payments.md**
```markdown
# Accept Payments with Stripe

## Create a PaymentIntent

```python
import stripe

stripe.PaymentIntent.create(
    amount=2000,
    currency='usd',
    metadata={'order_id': '123'}
)
```

[Todos los ejemplos y mejores prácticas oficiales...]
```

## 🔄 Proceso Durante `/generate-prp`

1. **Análisis**: Lee todos los links en `INITIAL.md`
2. **Scraping Masivo**: 6+ agentes paralelos scrapeando documentación
3. **Organización**: Cada página va a su directorio tecnológico
4. **Validación**: Verifica que el contenido sea válido
5. **Integración**: Combina con `examples/` para generar PRP completo

## 📈 Resultado Final

El **PRP generado** incluye:
- Referencias específicas a archivos en `research/`
- Código basado en documentación oficial real
- Patrones que realmente funcionan
- Confidence score 9/10 para implementación one-shot

## 🎯 Para el Sistema Gastronómico

La investigación automática cubrirá:
- **Transacciones ACID** para pagos seguros
- **WebSockets** para tiempo real cocina ↔ meseros
- **React Patterns** para PWA móvil
- **Stripe Integration** para procesamiento de pagos
- **PostgreSQL Optimization** para queries de reportes
- **FastAPI Security** para autenticación por roles

## 💡 Tip Importante

**No toques esta carpeta manualmente**. Todo se genera automáticamente y se organiza perfecto para que la IA tenga el contexto completo para generar tu sistema gastronómico completo.

¡El research automático es la **salsa secreta** de Context Engineering! 🚀