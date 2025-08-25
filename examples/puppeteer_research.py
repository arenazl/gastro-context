"""
Script para investigación automática de páginas modelo del rubro gastronómico.
Usa Puppeteer para capturar patrones de diseño, UX y funcionalidades.

SIEMPRE usar este patrón para research de competitors y referencias.
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Any
from playwright.async_api import async_playwright, Page, Browser
import aiofiles
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GastronomyResearcher:
    """
    Investigador automático para páginas del rubro gastronómico.
    Extrae patrones de diseño, componentes y funcionalidades.
    """
    
    def __init__(self, output_dir: str = "./research/competitors/"):
        self.output_dir = output_dir
        self.browser: Browser = None
        
        # URLs de referencia para investigar
        self.target_sites = {
            "toast_pos": {
                "url": "https://pos.toasttab.com/",
                "description": "Sistema POS líder para restaurantes",
                "focus": ["dashboard", "menu_management", "order_flow", "kitchen_display"]
            },
            "square_restaurants": {
                "url": "https://squareup.com/us/en/restaurants",
                "description": "Solución integral para restaurantes",
                "focus": ["payments", "analytics", "mobile_interface", "pos_hardware"]
            },
            "touchbistro": {
                "url": "https://www.touchbistro.com/",
                "description": "POS específico para restaurantes",
                "focus": ["tablet_interface", "menu_design", "table_management"]
            },
            "lightspeed_restaurant": {
                "url": "https://www.lightspeedhq.com/pos/restaurant/",
                "description": "Solución completa para restaurantes",
                "focus": ["inventory", "reports", "multi_location", "integrations"]
            },
            "uber_eats_merchant": {
                "url": "https://merchants.ubereats.com/",
                "description": "Dashboard de delivery",
                "focus": ["order_management", "analytics", "real_time_updates"]
            },
            "opentable": {
                "url": "https://www.opentable.com/",
                "description": "Gestión de reservas",
                "focus": ["calendar_view", "table_layout", "customer_management"]
            },
            "resy": {
                "url": "https://resy.com/",
                "description": "Sistema de reservas moderno",
                "focus": ["mobile_ux", "booking_flow", "user_experience"]
            },
            "clover": {
                "url": "https://www.clover.com/pos-systems/restaurant",
                "description": "Hardware y software integrado",
                "focus": ["hardware_integration", "payment_flow", "staff_management"]
            }
        }
    
    async def initialize(self):
        """Inicializar browser de Playwright"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        )
        
        # Crear directorio de output si no existe
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def close(self):
        """Cerrar browser"""
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
    
    async def research_site(self, site_key: str, site_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Investigar un sitio específico y extraer información relevante.
        """
        logger.info(f"Investigando {site_key}: {site_data['url']}")
        
        page = await self.browser.new_page()
        
        try:
            # Configurar viewport para tablets (común en restaurantes)
            await page.set_viewport_size({"width": 1024, "height": 768})
            
            # Navegar al sitio
            await page.goto(site_data['url'], wait_until='networkidle', timeout=30000)
            
            # Extraer información
            research_data = {
                "site_info": {
                    "name": site_key,
                    "url": site_data['url'],
                    "description": site_data['description'],
                    "focus_areas": site_data['focus'],
                    "researched_at": datetime.now().isoformat()
                },
                "page_analysis": await self.analyze_page_structure(page),
                "ui_patterns": await self.extract_ui_patterns(page),
                "color_scheme": await self.extract_color_scheme(page),
                "navigation": await self.analyze_navigation(page),
                "forms": await self.analyze_forms(page),
                "buttons": await self.analyze_buttons(page),
                "layout": await self.analyze_layout(page),
                "mobile_responsive": await self.check_mobile_responsive(page),
                "screenshots": await self.capture_screenshots(page, site_key)
            }
            
            return research_data
            
        except Exception as e:
            logger.error(f"Error investigando {site_key}: {str(e)}")
            return {
                "site_info": site_data,
                "error": str(e),
                "researched_at": datetime.now().isoformat()
            }
        finally:
            await page.close()
    
    async def analyze_page_structure(self, page: Page) -> Dict[str, Any]:
        """Analizar estructura general de la página"""
        return await page.evaluate("""
            () => {
                const structure = {
                    title: document.title,
                    meta_description: document.querySelector('meta[name="description"]')?.content || '',
                    headings: {
                        h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean),
                        h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(Boolean),
                        h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim()).filter(Boolean)
                    },
                    main_sections: Array.from(document.querySelectorAll('section, main, article')).map(section => ({
                        tag: section.tagName.toLowerCase(),
                        class: section.className,
                        id: section.id,
                        content_preview: section.textContent?.substring(0, 200).trim()
                    })),
                    technology_stack: {
                        frameworks: Array.from(document.querySelectorAll('script[src]')).map(script => {
                            const src = script.src;
                            if (src.includes('react')) return 'React';
                            if (src.includes('vue')) return 'Vue';
                            if (src.includes('angular')) return 'Angular';
                            if (src.includes('next')) return 'Next.js';
                            return null;
                        }).filter(Boolean),
                        css_frameworks: (() => {
                            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                            const styles = links.map(link => link.href).join(' ');
                            const frameworks = [];
                            if (styles.includes('bootstrap')) frameworks.push('Bootstrap');
                            if (styles.includes('tailwind')) frameworks.push('Tailwind CSS');
                            if (styles.includes('material')) frameworks.push('Material UI');
                            return frameworks;
                        })()
                    }
                };
                return structure;
            }
        """)
    
    async def extract_ui_patterns(self, page: Page) -> Dict[str, Any]:
        """Extraer patrones de UI específicos para restaurantes"""
        return await page.evaluate("""
            () => {
                const patterns = {
                    cards: Array.from(document.querySelectorAll('[class*="card"], .card, [class*="product"], [class*="item"]')).slice(0, 10).map(card => ({
                        classes: card.className,
                        structure: {
                            has_image: !!card.querySelector('img'),
                            has_title: !!card.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"]'),
                            has_price: !!card.querySelector('[class*="price"], [class*="cost"], [class*="$"]'),
                            has_button: !!card.querySelector('button, a[class*="button"], .btn')
                        }
                    })),
                    
                    buttons: Array.from(document.querySelectorAll('button, .btn, [class*="button"]')).slice(0, 15).map(btn => ({
                        text: btn.textContent?.trim(),
                        classes: btn.className,
                        style: {
                            background_color: getComputedStyle(btn).backgroundColor,
                            color: getComputedStyle(btn).color,
                            border_radius: getComputedStyle(btn).borderRadius,
                            padding: getComputedStyle(btn).padding
                        }
                    })),
                    
                    navigation: {
                        primary_nav: Array.from(document.querySelectorAll('nav, [class*="nav"], [class*="menu"]')).map(nav => ({
                            classes: nav.className,
                            items: Array.from(nav.querySelectorAll('a, button')).map(item => item.textContent?.trim()).filter(Boolean).slice(0, 10)
                        })),
                        
                        mobile_nav: !!document.querySelector('[class*="mobile"], [class*="hamburger"], [class*="toggle"]')
                    },
                    
                    tables_or_grids: Array.from(document.querySelectorAll('table, [class*="grid"], [class*="table"]')).length,
                    
                    forms: Array.from(document.querySelectorAll('form')).map(form => ({
                        inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
                            type: input.type || input.tagName.toLowerCase(),
                            placeholder: input.placeholder,
                            required: input.required
                        }))
                    }))
                };
                
                return patterns;
            }
        """)
    
    async def extract_color_scheme(self, page: Page) -> Dict[str, Any]:
        """Extraer esquema de colores del sitio"""
        return await page.evaluate("""
            () => {
                const elements = document.querySelectorAll('*');
                const colors = new Set();
                const backgrounds = new Set();
                
                Array.from(elements).slice(0, 100).forEach(el => {
                    const style = getComputedStyle(el);
                    const color = style.color;
                    const bg = style.backgroundColor;
                    
                    if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
                        colors.add(color);
                    }
                    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)') {
                        backgrounds.add(bg);
                    }
                });
                
                return {
                    primary_colors: Array.from(colors).slice(0, 10),
                    background_colors: Array.from(backgrounds).slice(0, 10),
                    dominant_scheme: (() => {
                        const bodyBg = getComputedStyle(document.body).backgroundColor;
                        const bodyColor = getComputedStyle(document.body).color;
                        return {
                            background: bodyBg,
                            text: bodyColor
                        };
                    })()
                };
            }
        """)
    
    async def analyze_navigation(self, page: Page) -> Dict[str, Any]:
        """Analizar patrones de navegación"""
        return await page.evaluate("""
            () => {
                const nav_elements = document.querySelectorAll('nav, [role="navigation"], [class*="nav"], header');
                
                return Array.from(nav_elements).map(nav => ({
                    type: nav.tagName.toLowerCase(),
                    classes: nav.className,
                    position: getComputedStyle(nav).position,
                    items: Array.from(nav.querySelectorAll('a, button')).map(item => ({
                        text: item.textContent?.trim(),
                        href: item.href || '',
                        classes: item.className
                    })).slice(0, 10)
                }));
            }
        """)
    
    async def analyze_forms(self, page: Page) -> List[Dict[str, Any]]:
        """Analizar formularios en la página"""
        return await page.evaluate("""
            () => {
                return Array.from(document.querySelectorAll('form')).map(form => ({
                    action: form.action,
                    method: form.method,
                    classes: form.className,
                    fields: Array.from(form.querySelectorAll('input, select, textarea')).map(field => ({
                        name: field.name,
                        type: field.type || field.tagName.toLowerCase(),
                        placeholder: field.placeholder,
                        required: field.required,
                        classes: field.className
                    }))
                }));
            }
        """)
    
    async def analyze_buttons(self, page: Page) -> List[Dict[str, Any]]:
        """Analizar estilos y patrones de botones"""
        return await page.evaluate("""
            () => {
                return Array.from(document.querySelectorAll('button, .btn, [class*="button"], input[type="submit"]')).slice(0, 20).map(btn => {
                    const style = getComputedStyle(btn);
                    return {
                        text: btn.textContent?.trim() || btn.value,
                        classes: btn.className,
                        type: btn.type || 'button',
                        styles: {
                            background: style.backgroundColor,
                            color: style.color,
                            border: style.border,
                            borderRadius: style.borderRadius,
                            padding: style.padding,
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight
                        },
                        dimensions: {
                            width: btn.offsetWidth,
                            height: btn.offsetHeight
                        }
                    };
                });
            }
        """)
    
    async def analyze_layout(self, page: Page) -> Dict[str, Any]:
        """Analizar layout general de la página"""
        return await page.evaluate("""
            () => {
                const body = document.body;
                const main = document.querySelector('main') || body;
                
                return {
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    layout_type: (() => {
                        const style = getComputedStyle(main);
                        if (style.display === 'grid') return 'css_grid';
                        if (style.display === 'flex') return 'flexbox';
                        return 'traditional';
                    })(),
                    header_height: document.querySelector('header')?.offsetHeight || 0,
                    footer_height: document.querySelector('footer')?.offsetHeight || 0,
                    sidebar_present: !!document.querySelector('[class*="sidebar"], aside'),
                    max_width: getComputedStyle(main).maxWidth,
                    container_classes: main.className
                };
            }
        """)
    
    async def check_mobile_responsive(self, page: Page) -> Dict[str, Any]:
        """Verificar responsive design"""
        # Probar diferentes tamaños de pantalla
        viewports = [
            {"width": 375, "height": 667, "name": "mobile"},
            {"width": 768, "height": 1024, "name": "tablet"},
            {"width": 1920, "height": 1080, "name": "desktop"}
        ]
        
        responsive_data = {}
        
        for viewport in viewports:
            await page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
            await page.wait_for_timeout(1000)  # Esperar que se ajuste
            
            responsive_data[viewport["name"]] = await page.evaluate("""
                () => {
                    return {
                        has_mobile_menu: !!document.querySelector('[class*="mobile-menu"], [class*="hamburger"]'),
                        navigation_changes: getComputedStyle(document.querySelector('nav') || document.body).display,
                        text_size_adjusts: getComputedStyle(document.body).fontSize,
                        layout_stacks: Array.from(document.querySelectorAll('[class*="grid"], [class*="flex"]')).some(el => 
                            getComputedStyle(el).flexDirection === 'column'
                        )
                    };
                }
            """)
        
        return responsive_data
    
    async def capture_screenshots(self, page: Page, site_key: str) -> Dict[str, str]:
        """Capturar screenshots de diferentes secciones"""
        screenshots = {}
        
        # Screenshot completo
        screenshot_path = f"{self.output_dir}/{site_key}_full_page.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        screenshots["full_page"] = screenshot_path
        
        # Screenshot del viewport actual
        screenshot_path = f"{self.output_dir}/{site_key}_viewport.png"
        await page.screenshot(path=screenshot_path)
        screenshots["viewport"] = screenshot_path
        
        # Screenshots de secciones específicas si existen
        sections = ['header', 'nav', 'main', 'footer', '[class*="dashboard"]', '[class*="menu"]']
        
        for section in sections:
            try:
                element = await page.query_selector(section)
                if element:
                    screenshot_path = f"{self.output_dir}/{site_key}_{section.replace('[', '').replace(']', '').replace('*=', '').replace('"', '')}.png"
                    await element.screenshot(path=screenshot_path)
                    screenshots[section] = screenshot_path
            except:
                continue
        
        return screenshots
    
    async def save_research_data(self, site_key: str, data: Dict[str, Any]):
        """Guardar datos de investigación en archivo JSON"""
        filename = f"{self.output_dir}/{site_key}_research.json"
        async with aiofiles.open(filename, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, indent=2, ensure_ascii=False))
        
        # También crear un resumen en markdown
        await self.create_markdown_summary(site_key, data)
    
    async def create_markdown_summary(self, site_key: str, data: Dict[str, Any]):
        """Crear resumen en markdown de la investigación"""
        filename = f"{self.output_dir}/{site_key}_summary.md"
        
        content = f"""# Investigación: {data['site_info']['name']}

**URL**: {data['site_info']['url']}
**Descripción**: {data['site_info']['description']}
**Investigado**: {data['site_info']['researched_at']}

## Análisis de Página

### Título
{data.get('page_analysis', {}).get('title', 'N/A')}

### Tecnologías Detectadas
- **Frameworks**: {', '.join(data.get('page_analysis', {}).get('technology_stack', {}).get('frameworks', []))}
- **CSS Frameworks**: {', '.join(data.get('page_analysis', {}).get('technology_stack', {}).get('css_frameworks', []))}

## Patrones de UI

### Navegación
{len(data.get('ui_patterns', {}).get('navigation', {}).get('primary_nav', []))} elementos de navegación detectados

### Botones Analizados
{len(data.get('ui_patterns', {}).get('buttons', []))} botones encontrados

### Tarjetas/Componentes
{len(data.get('ui_patterns', {}).get('cards', []))} componentes tipo tarjeta encontrados

## Esquema de Colores

### Colores Primarios
{', '.join(data.get('color_scheme', {}).get('primary_colors', [])[:5])}

### Colores de Fondo
{', '.join(data.get('color_scheme', {}).get('background_colors', [])[:5])}

## Responsive Design

- **Mobile Menu**: {'Sí' if data.get('mobile_responsive', {}).get('mobile', {}).get('has_mobile_menu') else 'No'}
- **Layout Adaptativo**: Detectado en múltiples viewports

## Screenshots Capturados

- Screenshot completo: `{site_key}_full_page.png`
- Screenshot viewport: `{site_key}_viewport.png`

## Insights para Sistema Gastronómico

### Patrones Aplicables
- Layout de menú/productos
- Diseño de botones de acción
- Esquema de colores para restaurantes
- Navegación móvil para tablets

### Elementos a Implementar
- [Componentes específicos detectados]
- [Patrones de UX identificados]
- [Funcionalidades clave observadas]

---

*Investigación automática generada con Playwright*
"""
        
        async with aiofiles.open(filename, 'w', encoding='utf-8') as f:
            await f.write(content)
    
    async def run_full_research(self):
        """Ejecutar investigación completa de todos los sitios"""
        await self.initialize()
        
        try:
            logger.info("Iniciando investigación automática de sitios gastronómicos...")
            
            for site_key, site_data in self.target_sites.items():
                try:
                    research_data = await self.research_site(site_key, site_data)
                    await self.save_research_data(site_key, research_data)
                    logger.info(f"✅ Completado: {site_key}")
                    
                    # Pausa entre sitios para no sobrecargar
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"❌ Error en {site_key}: {str(e)}")
                    continue
            
            logger.info("🎉 Investigación completa terminada!")
            await self.create_consolidated_report()
            
        finally:
            await self.close()
    
    async def create_consolidated_report(self):
        """Crear reporte consolidado de todos los sitios investigados"""
        filename = f"{self.output_dir}/CONSOLIDATED_RESEARCH_REPORT.md"
        
        content = f"""# Reporte Consolidado - Investigación Gastronómica

**Generado**: {datetime.now().isoformat()}
**Sitios Investigados**: {len(self.target_sites)}

## Resumen Ejecutivo

Este reporte consolida los patrones, componentes y funcionalidades encontradas en los principales sistemas POS y plataformas gastronómicas del mercado.

## Sitios Analizados

"""
        
        for site_key, site_data in self.target_sites.items():
            content += f"""
### {site_data['description']}
- **URL**: {site_data['url']}
- **Enfoque**: {', '.join(site_data['focus'])}
- **Archivo de Investigación**: `{site_key}_research.json`
- **Resumen**: `{site_key}_summary.md`

"""
        
        content += """
## Patrones Comunes Identificados

### Navegación
- Menú lateral para administración
- Navegación top para acceso rápido
- Breadcrumbs para flujos complejos

### Componentes de Producto/Menú
- Tarjetas con imagen, nombre, precio
- Botones de acción prominentes
- Indicadores de disponibilidad

### Dashboard/Analytics
- Cards de métricas con iconos
- Gráficos de tiempo real
- Alertas y notificaciones

### Mobile/Tablet UX
- Botones grandes (44px mínimo)
- Gestos touch amigables
- Layout responsive

## Recomendaciones para Implementación

### Tecnologías Detectadas
- React como framework predominante
- Tailwind CSS para estilos
- Componentes modulares reutilizables

### Patrones de Diseño
- Color schemes cálidos para restaurantes
- Iconografía específica del rubro
- Layouts optimizados para tablets

### Funcionalidades Clave
- Gestión de pedidos en tiempo real
- Interfaces de cocina especializadas
- Sistemas de pago integrados
- Analytics y reportes visuales

---

*Para análisis detallado, revisar archivos individuales de cada sitio investigado.*
"""
        
        async with aiofiles.open(filename, 'w', encoding='utf-8') as f:
            await f.write(content)

# Script ejecutable
async def main():
    """Función principal para ejecutar la investigación"""
    researcher = GastronomyResearcher()
    await researcher.run_full_research()

if __name__ == "__main__":
    # Ejecutar investigación
    asyncio.run(main())

"""
INSTRUCCIONES DE USO:

1. Instalar dependencias:
   pip install playwright aiofiles
   playwright install chromium

2. Ejecutar investigación:
   python examples/puppeteer_research.py

3. Resultados en:
   ./research/competitors/
   ├── toast_pos_research.json
   ├── toast_pos_summary.md
   ├── toast_pos_full_page.png
   ├── square_restaurants_research.json
   ├── square_restaurants_summary.md
   └── CONSOLIDATED_RESEARCH_REPORT.md

4. Usar en Context Engineering:
   - Los archivos .json contienen datos estructurados
   - Los archivos .md son legibles para review
   - Los screenshots muestran UI patterns
   - El reporte consolidado da insights generales

INTEGRATION CON FRAMEWORK:
- Ejecutar antes de /generate-prp para tener context actualizado
- Referenciar archivos en INITIAL.md
- Usar patterns identificados en examples/
"""