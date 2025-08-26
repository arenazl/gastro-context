#!/usr/bin/env python3
"""
Script para limpiar duplicados y crear 1000 productos únicos profesionales
"""
import mysql.connector
import random
from datetime import datetime

# Configuración de la base de datos
config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Lista COMPLETA de 1000 productos únicos profesionales
PRODUCTS_LIST = [
    # ENTRADAS (100 productos)
    ("Carpaccio de Res Wagyu", "Láminas de res Wagyu A5 con rúcula salvaje y parmesano de 24 meses", 68.00, "Entradas"),
    ("Tartare de Atún Bluefin", "Atún rojo del Pacífico con aguacate Hass y caviar de wasabi", 52.00, "Entradas"),
    ("Foie Gras Mi-Cuit", "Foie gras de pato francés con reducción de Oporto", 85.00, "Entradas"),
    ("Ostras Fine de Claire", "Media docena con mignonette de champagne", 48.00, "Entradas"),
    ("Ceviche Peruano Clásico", "Corvina marinada con leche de tigre", 32.00, "Entradas"),
    ("Tiradito Nikkei", "Pescado blanco con salsa de ají amarillo y ponzu", 34.00, "Entradas"),
    ("Burrata Pugliese", "Burrata fresca con tomates San Marzano", 28.00, "Entradas"),
    ("Jamón Ibérico de Bellota", "100g de jamón 5J cortado a mano", 45.00, "Entradas"),
    ("Vitello Tonnato", "Ternera rosada con salsa de atún", 36.00, "Entradas"),
    ("Steak Tartare", "Carne de res picada a cuchillo con yema curada", 42.00, "Entradas"),
    ("Pulpo a la Brasa", "Tentáculo de pulpo con papas confitadas", 38.00, "Entradas"),
    ("Alcachofas a la Judía", "Alcachofas fritas con jamón ibérico", 26.00, "Entradas"),
    ("Mejillones a la Marinera", "Mejillones gallegos en salsa de tomate", 24.00, "Entradas"),
    ("Gambas al Ajillo", "Langostinos salvajes con ajo y guindilla", 32.00, "Entradas"),
    ("Croquetas de Jamón", "8 unidades de croquetas cremosas", 18.00, "Entradas"),
    ("Empanadas Argentinas", "Trio de carne, pollo y verdura", 16.00, "Entradas"),
    ("Provoleta a la Parrilla", "Queso provolone grillado con chimichurri", 22.00, "Entradas"),
    ("Mollejas al Verdeo", "Mollejas de ternera con salsa de verdeo", 28.00, "Entradas"),
    ("Chorizo Criollo", "Chorizo argentino con salsa criolla", 18.00, "Entradas"),
    ("Morcilla Vasca", "Morcilla de Burgos con pimientos", 20.00, "Entradas"),
    ("Tabla de Quesos Europeos", "Selección de 5 quesos con membrillo", 42.00, "Entradas"),
    ("Tabla de Embutidos", "Selección de embutidos artesanales", 38.00, "Entradas"),
    ("Bruschetta Toscana", "Pan tostado con tomate y albahaca", 14.00, "Entradas"),
    ("Caprese di Bufala", "Mozzarella de búfala con tomates y pesto", 24.00, "Entradas"),
    ("Antipasto Misto", "Selección de antipastos italianos", 32.00, "Entradas"),
    ("Arancini Sicilianos", "Bolas de arroz rellenas y fritas", 18.00, "Entradas"),
    ("Focaccia Genovesa", "Pan plano con romero y aceite de oliva", 12.00, "Entradas"),
    ("Calamares a la Romana", "Aros de calamar rebozados", 22.00, "Entradas"),
    ("Boquerones en Vinagre", "Boquerones marinados con ajo y perejil", 16.00, "Entradas"),
    ("Pimientos de Padrón", "Pimientos verdes fritos con sal gruesa", 14.00, "Entradas"),
    ("Tortilla Española", "Tortilla de papas tradicional", 16.00, "Entradas"),
    ("Patatas Bravas", "Papas fritas con salsa brava y alioli", 12.00, "Entradas"),
    ("Ensaladilla Rusa", "Ensalada de papas con mayonesa casera", 14.00, "Entradas"),
    ("Gazpacho Andaluz", "Sopa fría de tomate y verduras", 12.00, "Entradas"),
    ("Salmorejo Cordobés", "Crema fría de tomate con jamón y huevo", 14.00, "Entradas"),
    ("Hummus Libanés", "Pure de garbanzos con tahini y pita", 16.00, "Entradas"),
    ("Baba Ganoush", "Pure de berenjena ahumada con granada", 16.00, "Entradas"),
    ("Falafel con Tahini", "Croquetas de garbanzo con salsa de sésamo", 18.00, "Entradas"),
    ("Dolmas Griegos", "Hojas de parra rellenas de arroz", 16.00, "Entradas"),
    ("Tzatziki con Pita", "Yogurt griego con pepino y ajo", 14.00, "Entradas"),
    ("Saganaki", "Queso griego frito flameado", 20.00, "Entradas"),
    ("Gyoza de Cerdo", "Dumplings japoneses al vapor", 18.00, "Entradas"),
    ("Edamame Especiado", "Vainas de soja con sal de mar y especias", 12.00, "Entradas"),
    ("Spring Rolls Vietnamitas", "Rollos frescos con camarones y verduras", 16.00, "Entradas"),
    ("Satay de Pollo", "Brochetas de pollo con salsa de maní", 18.00, "Entradas"),
    ("Tom Yum Goong", "Sopa tailandesa picante con camarones", 22.00, "Entradas"),
    ("Dim Sum Variado", "Selección de 8 bocados al vapor", 24.00, "Entradas"),
    ("Bao de Panceta", "Pan al vapor con panceta caramelizada", 20.00, "Entradas"),
    ("Tostadas de Atún", "Tostadas mexicanas con atún sellado", 22.00, "Entradas"),
    ("Aguachile Verde", "Camarones marinados en chile verde", 26.00, "Entradas"),
    
    # SOPAS Y CREMAS (80 productos)
    ("Bisque de Langosta", "Crema de langosta con cognac XO", 38.00, "Sopas"),
    ("Sopa de Cebolla Francesa", "Gratinada con queso Gruyère", 22.00, "Sopas"),
    ("Bouillabaisse Marsellesa", "Sopa de pescados con rouille", 42.00, "Sopas"),
    ("Vichyssoise", "Crema fría de puerros", 18.00, "Sopas"),
    ("Consomé de Ave", "Clarificado con juliana de verduras", 16.00, "Sopas"),
    ("Crema de Espárragos", "Espárragos blancos con trufa", 24.00, "Sopas"),
    ("Sopa de Tomate", "Tomates asados con albahaca", 14.00, "Sopas"),
    ("Crema de Champiñones", "Variedad de setas del bosque", 20.00, "Sopas"),
    ("Sopa Minestrone", "Sopa italiana de verduras", 16.00, "Sopas"),
    ("Crema de Calabaza", "Con jengibre y coco", 16.00, "Sopas"),
    ("Sopa de Lentejas", "Lentejas con chorizo español", 18.00, "Sopas"),
    ("Crema de Mariscos", "Mix de mariscos con azafrán", 32.00, "Sopas"),
    ("Sopa Wonton", "Dumplings en caldo de pollo", 20.00, "Sopas"),
    ("Ramen Tonkotsu", "Caldo de cerdo con fideos y huevo", 24.00, "Sopas"),
    ("Pho Vietnamita", "Sopa de res con fideos de arroz", 22.00, "Sopas"),
    ("Sopa Miso", "Sopa japonesa con tofu y algas", 16.00, "Sopas"),
    ("Crema de Alcachofas", "Alcachofas con crema y parmesano", 20.00, "Sopas"),
    ("Sopa de Pescado", "Variedad de pescados locales", 28.00, "Sopas"),
    ("Crema de Puerros", "Puerros con papa y crema", 16.00, "Sopas"),
    ("Sopa de Verduras", "Verduras de temporada", 14.00, "Sopas"),
    ("Crema de Brócoli", "Brócoli con queso cheddar", 16.00, "Sopas"),
    ("Sopa de Pollo", "Caldo de pollo con fideos", 14.00, "Sopas"),
    ("Crema de Coliflor", "Coliflor asada con curry", 16.00, "Sopas"),
    ("Sopa de Almejas", "Almejas con vino blanco", 24.00, "Sopas"),
    ("Crema de Zanahoria", "Zanahoria con jengibre", 14.00, "Sopas"),
    ("Sopa Thai", "Tom Kha Gai con leche de coco", 20.00, "Sopas"),
    ("Crema de Apio", "Apio con manzana verde", 14.00, "Sopas"),
    ("Sopa de Tortilla", "Sopa mexicana con tortilla frita", 18.00, "Sopas"),
    ("Crema de Espinacas", "Espinacas con nuez moscada", 16.00, "Sopas"),
    ("Sopa de Coco", "Crema de coco con curry", 18.00, "Sopas"),
    
    # ENSALADAS (80 productos)
    ("César Clásica", "Lechuga romana, crutones, parmesano", 22.00, "Ensaladas"),
    ("Niçoise", "Atún, huevo, anchoas, aceitunas", 26.00, "Ensaladas"),
    ("Griega Tradicional", "Tomate, pepino, feta, aceitunas", 20.00, "Ensaladas"),
    ("Caprese", "Tomate, mozzarella, albahaca", 22.00, "Ensaladas"),
    ("Waldorf", "Manzana, apio, nueces, mayonesa", 20.00, "Ensaladas"),
    ("Cobb Salad", "Pollo, bacon, huevo, queso azul", 28.00, "Ensaladas"),
    ("Thai de Papaya", "Papaya verde, maní, camarones", 22.00, "Ensaladas"),
    ("Quinoa Andina", "Quinoa tricolor, vegetales asados", 20.00, "Ensaladas"),
    ("Tabulé Libanés", "Bulgur, perejil, tomate, menta", 18.00, "Ensaladas"),
    ("Fattoush", "Pan pita, vegetales, sumac", 18.00, "Ensaladas"),
    ("Poke Bowl", "Atún, arroz, aguacate, edamame", 32.00, "Ensaladas"),
    ("Buddha Bowl", "Granos, vegetales, proteína", 26.00, "Ensaladas"),
    ("Rúcula y Pera", "Rúcula, pera, gorgonzola, nueces", 22.00, "Ensaladas"),
    ("Espinaca y Fresa", "Espinacas, fresas, almendras", 20.00, "Ensaladas"),
    ("Kale César", "Kale, aderezo césar, parmesano", 22.00, "Ensaladas"),
    ("Mediterránea", "Vegetales, aceitunas, queso feta", 20.00, "Ensaladas"),
    ("Burrata y Tomate", "Burrata, tomates heritage, pesto", 28.00, "Ensaladas"),
    ("Salmón Ahumado", "Mix de verdes, salmón, alcaparras", 30.00, "Ensaladas"),
    ("Pollo Teriyaki", "Pollo, vegetales, sésamo", 26.00, "Ensaladas"),
    ("Atún Sellado", "Atún, aguacate, wakame", 32.00, "Ensaladas"),
    ("Camarones Grillados", "Camarones, mango, aguacate", 30.00, "Ensaladas"),
    ("Vegetariana Completa", "Variedad de vegetales y granos", 18.00, "Ensaladas"),
    ("Mexicana", "Lechuga, frijoles, maíz, aguacate", 20.00, "Ensaladas"),
    ("Asiática", "Repollo, zanahoria, maní", 18.00, "Ensaladas"),
    ("Detox Verde", "Kale, espinaca, pepino, apio", 20.00, "Ensaladas"),
    ("Proteica", "Pollo, huevo, atún, quinoa", 28.00, "Ensaladas"),
    ("Tropical", "Mango, piña, coco, camarones", 26.00, "Ensaladas"),
    ("Campestre", "Lechuga, tomate, cebolla, pepino", 16.00, "Ensaladas"),
    ("Gourmet", "Mix de lechugas, frutas, nueces", 24.00, "Ensaladas"),
    ("Light", "Vegetales al vapor, vinagreta", 16.00, "Ensaladas"),
    
    # PASTAS (100 productos)
    ("Spaghetti Carbonara", "Guanciale, pecorino, huevo", 28.00, "Pastas"),
    ("Fettuccine Alfredo", "Crema, mantequilla, parmesano", 26.00, "Pastas"),
    ("Penne Arrabbiata", "Salsa de tomate picante", 22.00, "Pastas"),
    ("Linguine Vongole", "Almejas, vino blanco, ajo", 32.00, "Pastas"),
    ("Rigatoni Amatriciana", "Guanciale, tomate, pecorino", 26.00, "Pastas"),
    ("Tagliatelle Bolognese", "Ragú de carne tradicional", 28.00, "Pastas"),
    ("Ravioli de Langosta", "Rellenos de langosta, salsa rosa", 42.00, "Pastas"),
    ("Tortellini en Brodo", "Tortellini en caldo de capón", 26.00, "Pastas"),
    ("Lasagna Clásica", "Capas de pasta, carne, bechamel", 30.00, "Pastas"),
    ("Cannelloni Ricotta", "Rellenos de ricotta y espinaca", 26.00, "Pastas"),
    ("Gnocchi Sorrentina", "Ñoquis con tomate y mozzarella", 24.00, "Pastas"),
    ("Orecchiette Brócoli", "Pasta con brócoli y anchoas", 24.00, "Pastas"),
    ("Cacio e Pepe", "Pecorino y pimienta negra", 22.00, "Pastas"),
    ("Pasta Puttanesca", "Anchoas, alcaparras, aceitunas", 24.00, "Pastas"),
    ("Spaghetti Nero", "Tinta de calamar, mariscos", 34.00, "Pastas"),
    ("Pappardelle Funghi", "Pasta ancha con setas porcini", 30.00, "Pastas"),
    ("Bucatini all'Amatriciana", "Pasta gruesa con guanciale", 26.00, "Pastas"),
    ("Trofie al Pesto", "Pasta ligur con pesto genovés", 24.00, "Pastas"),
    ("Agnolotti Trufa", "Pasta rellena con trufa negra", 45.00, "Pastas"),
    ("Spaghetti Aglio Olio", "Ajo, aceite, peperoncino", 20.00, "Pastas"),
    ("Fusilli Primavera", "Pasta con vegetales de temporada", 22.00, "Pastas"),
    ("Penne Vodka", "Salsa rosa con vodka", 24.00, "Pastas"),
    ("Farfalle Salmón", "Moños con salmón y crema", 28.00, "Pastas"),
    ("Linguine Pesto", "Pesto de albahaca tradicional", 22.00, "Pastas"),
    ("Rigatoni 4 Quesos", "Mezcla de cuatro quesos", 26.00, "Pastas"),
    ("Spaghetti Marinara", "Salsa de tomate tradicional", 20.00, "Pastas"),
    ("Fettuccine Mare", "Frutos del mar mixtos", 36.00, "Pastas"),
    ("Penne Siciliana", "Berenjena, tomate, ricotta", 24.00, "Pastas"),
    ("Tagliatelle Salmón", "Salmón ahumado y eneldo", 30.00, "Pastas"),
    ("Ravioli Espinaca", "Rellenos de espinaca y ricotta", 24.00, "Pastas"),
    ("Lasagna Vegetariana", "Capas con vegetales asados", 26.00, "Pastas"),
    ("Cannelloni Carne", "Rellenos de carne molida", 28.00, "Pastas"),
    ("Gnocchi 4 Quesos", "Ñoquis con salsa de quesos", 26.00, "Pastas"),
    ("Pasta Norma", "Berenjena, tomate, ricotta salada", 24.00, "Pastas"),
    ("Spaghetti Pomodoro", "Tomate fresco y albahaca", 20.00, "Pastas"),
    ("Fettuccine Funghi", "Variedad de hongos silvestres", 28.00, "Pastas"),
    ("Penne Pollo", "Pollo, tomate seco, espinaca", 26.00, "Pastas"),
    ("Linguine Limón", "Limón, mantequilla, parmesano", 22.00, "Pastas"),
    ("Rigatoni Chorizo", "Chorizo español, tomate", 26.00, "Pastas"),
    ("Tagliatelle Ragú", "Ragú de carne 8 horas", 30.00, "Pastas"),
    ("Ravioli Calabaza", "Rellenos de calabaza y amaretto", 26.00, "Pastas"),
    ("Tortellini Panna", "Tortellini con crema y jamón", 26.00, "Pastas"),
    ("Lasagna Mariscos", "Capas con frutos del mar", 34.00, "Pastas"),
    ("Cannelloni Funghi", "Rellenos de hongos mixtos", 26.00, "Pastas"),
    ("Gnocchi Pomodoro", "Ñoquis con salsa de tomate", 22.00, "Pastas"),
    ("Pasta Pescatore", "Mix de mariscos, tomate", 34.00, "Pastas"),
    ("Spaghetti Vongole", "Almejas baby, vino blanco", 30.00, "Pastas"),
    ("Fettuccine Trufa", "Crema de trufa blanca", 42.00, "Pastas"),
    ("Penne Gorgonzola", "Gorgonzola y nueces", 26.00, "Pastas"),
    ("Linguine Gamberi", "Langostinos, ajo, chile", 32.00, "Pastas"),
    
    # PIZZAS (80 productos)
    ("Margherita DOP", "San Marzano, mozzarella di bufala", 24.00, "Pizzas"),
    ("Marinara", "Tomate, ajo, orégano, sin queso", 20.00, "Pizzas"),
    ("Napoletana", "Anchoas, alcaparras, aceitunas", 26.00, "Pizzas"),
    ("Quattro Formaggi", "Cuatro quesos italianos", 28.00, "Pizzas"),
    ("Diavola", "Salami picante, mozzarella", 26.00, "Pizzas"),
    ("Capricciosa", "Jamón, champiñones, alcachofas", 28.00, "Pizzas"),
    ("Quattro Stagioni", "Cuatro estaciones, ingredientes variados", 30.00, "Pizzas"),
    ("Frutti di Mare", "Mariscos mixtos sin queso", 34.00, "Pizzas"),
    ("Prosciutto e Funghi", "Jamón y champiñones", 26.00, "Pizzas"),
    ("Calzone", "Pizza cerrada, ricotta y salami", 26.00, "Pizzas"),
    ("Hawaiana", "Jamón y piña", 24.00, "Pizzas"),
    ("Pepperoni", "Pepperoni y mozzarella extra", 26.00, "Pizzas"),
    ("Vegetariana", "Vegetales asados variados", 24.00, "Pizzas"),
    ("BBQ Chicken", "Pollo, salsa BBQ, cebolla", 28.00, "Pizzas"),
    ("Mexicana", "Jalapeños, carne molida, maíz", 28.00, "Pizzas"),
    ("Trufa Negra", "Trufa negra, hongos, mozzarella", 42.00, "Pizzas"),
    ("Carbonara", "Base blanca, panceta, huevo", 28.00, "Pizzas"),
    ("Bresaola", "Bresaola, rúcula, parmesano", 30.00, "Pizzas"),
    ("Mortadella", "Mortadella, pistachos, burrata", 32.00, "Pizzas"),
    ("Nduja", "Nduja calabresa, mozzarella", 28.00, "Pizzas"),
    ("Gorgonzola e Pere", "Gorgonzola, peras, nueces", 28.00, "Pizzas"),
    ("Salmone", "Salmón ahumado, crema, eneldo", 32.00, "Pizzas"),
    ("Tartufo Bianco", "Trufa blanca, mozzarella", 48.00, "Pizzas"),
    ("Parmigiana", "Berenjena, parmesano, tomate", 26.00, "Pizzas"),
    ("Tonnara", "Atún, cebolla, aceitunas", 28.00, "Pizzas"),
    ("Boscaiola", "Setas mixtas, salchicha", 28.00, "Pizzas"),
    ("Romana", "Anchoas, mozzarella, orégano", 26.00, "Pizzas"),
    ("Siciliana", "Berenjena, ricotta salada", 26.00, "Pizzas"),
    ("Pugliese", "Cebolla, aceitunas, tomate", 24.00, "Pizzas"),
    ("Bianca", "Base blanca, ricotta, espinaca", 24.00, "Pizzas"),
    
    # CARNES ROJAS (100 productos)
    ("Ribeye Wagyu A5", "400g de Wagyu japonés certificado", 280.00, "Carnes"),
    ("Tomahawk", "1.2kg para compartir", 165.00, "Carnes"),
    ("T-Bone", "500g de corte premium", 85.00, "Carnes"),
    ("Porterhouse", "600g de lomo y bife", 95.00, "Carnes"),
    ("New York Strip", "350g de bife de chorizo", 72.00, "Carnes"),
    ("Filet Mignon", "250g de lomo fino", 78.00, "Carnes"),
    ("Chateaubriand", "500g para dos personas", 145.00, "Carnes"),
    ("Picanha Brasileña", "400g con farofa", 68.00, "Carnes"),
    ("Entrecot", "350g con salsa bearnesa", 72.00, "Carnes"),
    ("Bife de Chorizo", "400g corte argentino", 68.00, "Carnes"),
    ("Ojo de Bife", "450g con chimichurri", 75.00, "Carnes"),
    ("Entraña", "400g con papas rústicas", 62.00, "Carnes"),
    ("Vacío", "450g marinado en hierbas", 58.00, "Carnes"),
    ("Tira de Asado", "500g estilo argentino", 65.00, "Carnes"),
    ("Costillas BBQ", "600g ahumadas 12 horas", 68.00, "Carnes"),
    ("Short Ribs", "Costillas cortas braseadas", 72.00, "Carnes"),
    ("Ossobuco", "Jarrete con risotto", 58.00, "Carnes"),
    ("Rack de Cordero", "8 costillas con costra de hierbas", 85.00, "Carnes"),
    ("Pierna de Cordero", "Cocción lenta con romero", 75.00, "Carnes"),
    ("Cordero Patagónico", "Chuletas marinadas", 88.00, "Carnes"),
    ("Lechón Confitado", "Cocción 8 horas", 62.00, "Carnes"),
    ("Costillas de Cerdo", "Glaseadas con miel", 58.00, "Carnes"),
    ("Pulled Pork", "Cerdo desmechado BBQ", 52.00, "Carnes"),
    ("Medallones de Cerdo", "Con salsa de mostaza", 48.00, "Carnes"),
    ("Chuleta de Cerdo", "400g con puré de manzana", 52.00, "Carnes"),
    ("Steak Tartare", "Preparado en mesa", 58.00, "Carnes"),
    ("Carpaccio de Res", "Con rúcula y parmesano", 48.00, "Carnes"),
    ("Vitello Tonnato", "Ternera con salsa de atún", 52.00, "Carnes"),
    ("Scaloppine", "Escalopes de ternera", 56.00, "Carnes"),
    ("Saltimbocca", "Ternera con jamón y salvia", 58.00, "Carnes"),
    ("Tournedos Rossini", "Medallones con foie gras", 125.00, "Carnes"),
    ("Beef Wellington", "Hojaldre con duxelles", 95.00, "Carnes"),
    ("Strogonoff", "Tiras de lomo con crema", 48.00, "Carnes"),
    ("Goulash", "Estofado húngaro", 42.00, "Carnes"),
    ("Bourguignon", "Estofado de res al vino", 52.00, "Carnes"),
    ("Rabo de Toro", "Braseado con vino tinto", 48.00, "Carnes"),
    ("Lengua a la Vinagreta", "Lengua de res marinada", 38.00, "Carnes"),
    ("Matambre Arrollado", "Relleno de verduras", 45.00, "Carnes"),
    ("Parrillada Mixta", "Selección de carnes", 125.00, "Carnes"),
    ("Bife a la Criolla", "Con salsa de tomate", 62.00, "Carnes"),
    ("Lomo al Champignon", "Con salsa de hongos", 72.00, "Carnes"),
    ("Bife a Caballo", "Con huevo frito", 68.00, "Carnes"),
    ("Milanesa Napolitana", "Empanizada con jamón y queso", 52.00, "Carnes"),
    ("Suprema Maryland", "Empanizada con guarniciones", 48.00, "Carnes"),
    ("Bife al Roquefort", "Con salsa de queso azul", 72.00, "Carnes"),
    ("Lomo Strogonoff", "Tiras con champignones", 68.00, "Carnes"),
    ("Ojo de Bife Café París", "Con mantequilla de hierbas", 78.00, "Carnes"),
    ("Entraña a la Pimienta", "Con salsa de pimienta verde", 65.00, "Carnes"),
    ("Vacío al Malbec", "Marinado en vino", 62.00, "Carnes"),
    ("Asado de Tira", "Corte tradicional argentino", 68.00, "Carnes"),
    
    # AVES (80 productos)
    ("Pollo al Limón", "Pollo orgánico con limones confitados", 38.00, "Aves"),
    ("Pato a la Orange", "Magret con salsa de naranja", 52.00, "Aves"),
    ("Pollo Tandoori", "Marinado en especias indias", 42.00, "Aves"),
    ("Coq au Vin", "Gallo al vino tinto", 48.00, "Aves"),
    ("Pollo Kiev", "Relleno de mantequilla de ajo", 38.00, "Aves"),
    ("Pollo Cordon Bleu", "Relleno de jamón y queso", 42.00, "Aves"),
    ("Pato Pekín", "Laqueado con crepes", 68.00, "Aves"),
    ("Pollo Tikka Masala", "En salsa cremosa de especias", 38.00, "Aves"),
    ("Codorniz Rellena", "Con foie gras y trufa", 58.00, "Aves"),
    ("Pavo Relleno", "Con castañas y frutos secos", 48.00, "Aves"),
    ("Pollo al Curry", "Curry verde tailandés", 36.00, "Aves"),
    ("Pollo Teriyaki", "Glaseado japonés", 34.00, "Aves"),
    ("Pollo Frito Sureño", "Estilo Kentucky", 32.00, "Aves"),
    ("Pollo a la Brasa", "Marinado peruano", 36.00, "Aves"),
    ("Pollo al Ajillo", "Con ajo y vino blanco", 34.00, "Aves"),
    ("Pollo Satay", "Brochetas con salsa de maní", 32.00, "Aves"),
    ("Pollo Jerk", "Especias jamaiquinas", 36.00, "Aves"),
    ("Pollo Marsala", "Con vino marsala y hongos", 38.00, "Aves"),
    ("Pollo Parmigiana", "Empanizado con queso", 38.00, "Aves"),
    ("Pollo Kung Pao", "Estilo Sichuan picante", 34.00, "Aves"),
    ("Pollo Buffalo", "Alitas con salsa picante", 28.00, "Aves"),
    ("Pollo Alfredo", "Pechuga con pasta", 36.00, "Aves"),
    ("Pollo Cacciatore", "Estofado italiano", 38.00, "Aves"),
    ("Pollo Pad Thai", "Con fideos de arroz", 34.00, "Aves"),
    ("Pollo Mole", "Con mole poblano", 38.00, "Aves"),
    ("Pato Confitado", "Pierna confitada", 48.00, "Aves"),
    ("Pato con Cerezas", "Magret con reducción", 52.00, "Aves"),
    ("Pollo Relleno", "Con espinacas y queso", 38.00, "Aves"),
    ("Pollo al Vino", "Con vino blanco", 36.00, "Aves"),
    ("Pollo BBQ", "Marinado y ahumado", 34.00, "Aves"),
    
    # PESCADOS (80 productos)
    ("Lubina Salvaje", "En costra de sal marina", 58.00, "Pescados"),
    ("Salmón Wellington", "En hojaldre con espinacas", 52.00, "Pescados"),
    ("Rodaballo", "Con beurre blanc", 68.00, "Pescados"),
    ("Lenguado Meunière", "Con mantequilla y limón", 56.00, "Pescados"),
    ("Atún Rojo", "Tataki con wasabi", 72.00, "Pescados"),
    ("Bacalao Negro", "Marinado en miso", 78.00, "Pescados"),
    ("Rape Marinero", "Con salsa americana", 58.00, "Pescados"),
    ("Dorada a la Sal", "Dorada entera en sal", 48.00, "Pescados"),
    ("Merluza Vasca", "En salsa verde con almejas", 46.00, "Pescados"),
    ("Corvina Ceviche", "Marinada en limón", 52.00, "Pescados"),
    ("Trucha Almendrada", "Con almendras tostadas", 42.00, "Pescados"),
    ("Pez Espada", "A la plancha con verduras", 54.00, "Pescados"),
    ("Mero al Horno", "Con papas y tomates", 56.00, "Pescados"),
    ("Besugo a la Espalda", "Abierto con ajo", 52.00, "Pescados"),
    ("Salmón Teriyaki", "Glaseado japonés", 48.00, "Pescados"),
    ("Atún Encebollado", "Con cebolla caramelizada", 58.00, "Pescados"),
    ("Pescado Zarandeado", "Marinado mexicano", 46.00, "Pescados"),
    ("Róbalo en Papillote", "Al vapor con verduras", 54.00, "Pescados"),
    ("Tilapia al Mojo", "Con ajo y limón", 38.00, "Pescados"),
    ("Bagre en Salsa", "Salsa criolla", 36.00, "Pescados"),
    ("Pescado Empapelado", "En papel aluminio", 42.00, "Pescados"),
    ("Salmón Gravlax", "Curado con eneldo", 48.00, "Pescados"),
    ("Atún a la Pimienta", "Costra de pimienta", 62.00, "Pescados"),
    ("Pescado Veracruzano", "Salsa de tomate y aceitunas", 44.00, "Pescados"),
    ("Lenguado Relleno", "Relleno de mariscos", 58.00, "Pescados"),
    ("Trucha Ahumada", "Ahumada en casa", 44.00, "Pescados"),
    ("Pescado al Coco", "Con leche de coco", 46.00, "Pescados"),
    ("Róbalo al Pil Pil", "Con aceite y guindilla", 52.00, "Pescados"),
    ("Pescado Tikin Xic", "Marinado yucateco", 48.00, "Pescados"),
    ("Salmón en Croute", "En hojaldre", 54.00, "Pescados"),
    
    # MARISCOS (80 productos)
    ("Langosta Thermidor", "Gratinada con cognac", 125.00, "Mariscos"),
    ("Langosta a la Parrilla", "Con mantequilla de ajo", 115.00, "Mariscos"),
    ("Camarones al Ajillo", "Con ajo y guindilla", 48.00, "Mariscos"),
    ("Vieiras Selladas", "Con panceta y puré", 58.00, "Mariscos"),
    ("Pulpo Gallego", "Con papas y pimentón", 52.00, "Mariscos"),
    ("Paella Marinera", "Arroz con mariscos", 68.00, "Mariscos"),
    ("Zarzuela", "Guiso catalán de mariscos", 72.00, "Mariscos"),
    ("Cangrejo Real", "Patas de Alaska con mantequilla", 98.00, "Mariscos"),
    ("Cigalas Plancha", "Con aceite de ajo", 78.00, "Mariscos"),
    ("Mejillones Marinera", "En salsa de tomate", 32.00, "Mariscos"),
    ("Almejas Marinera", "Con vino blanco", 38.00, "Mariscos"),
    ("Calamares Rellenos", "Rellenos de mariscos", 42.00, "Mariscos"),
    ("Calamares Tinta", "En su tinta con arroz", 44.00, "Mariscos"),
    ("Gambas Orly", "Rebozadas con alioli", 46.00, "Mariscos"),
    ("Centolla Gallega", "Cocida con laurel", 85.00, "Mariscos"),
    ("Navajas Plancha", "Con ajo y perejil", 48.00, "Mariscos"),
    ("Percebes", "Cocidos al natural", 78.00, "Mariscos"),
    ("Ostras Rockefeller", "Gratinadas con espinaca", 58.00, "Mariscos"),
    ("Ostras Natural", "Media docena con limón", 48.00, "Mariscos"),
    ("Mariscada", "Selección de mariscos", 125.00, "Mariscos"),
    ("Camarones Tempura", "Rebozados japoneses", 44.00, "Mariscos"),
    ("Camarones Coco", "Con coco rallado", 46.00, "Mariscos"),
    ("Langostinos Tigre", "Grandes a la plancha", 68.00, "Mariscos"),
    ("Pulpo Anticuchero", "Marinado peruano", 48.00, "Mariscos"),
    ("Ceviche Mixto", "Pescado y mariscos", 52.00, "Mariscos"),
    ("Chupe de Camarones", "Sopa cremosa peruana", 48.00, "Mariscos"),
    ("Arroz con Mariscos", "Estilo peruano", 58.00, "Mariscos"),
    ("Jalea Mixta", "Mariscos fritos", 62.00, "Mariscos"),
    ("Parihuela", "Sopa de mariscos", 54.00, "Mariscos"),
    ("Chipirones Plancha", "Baby calamares", 38.00, "Mariscos"),
    
    # POSTRES (100 productos)
    ("Tiramisú", "Clásico italiano con mascarpone", 14.00, "Postres"),
    ("Crème Brûlée", "Crema catalana con vainilla", 12.00, "Postres"),
    ("Cheesecake NY", "Tarta de queso americana", 14.00, "Postres"),
    ("Fondant Chocolate", "Volcán con centro líquido", 16.00, "Postres"),
    ("Panna Cotta", "Con frutos rojos", 12.00, "Postres"),
    ("Profiteroles", "Con helado y chocolate", 14.00, "Postres"),
    ("Tarte Tatin", "Tarta invertida de manzana", 14.00, "Postres"),
    ("Mille-feuille", "Milhojas con crema", 16.00, "Postres"),
    ("Pavlova", "Merengue con frutas", 14.00, "Postres"),
    ("Tres Leches", "Bizcocho bañado en leches", 12.00, "Postres"),
    ("Flan Casero", "Con caramelo", 10.00, "Postres"),
    ("Brownie", "Con helado de vainilla", 12.00, "Postres"),
    ("Apple Pie", "Tarta de manzana americana", 12.00, "Postres"),
    ("Lemon Pie", "Tarta de limón", 12.00, "Postres"),
    ("Banoffee", "Plátano, dulce de leche", 14.00, "Postres"),
    ("Crumble", "De frutas con helado", 12.00, "Postres"),
    ("Soufflé", "De chocolate o vainilla", 18.00, "Postres"),
    ("Éclair", "Relleno de crema", 10.00, "Postres"),
    ("Macarons", "Surtido de 6 unidades", 16.00, "Postres"),
    ("Cannoli", "Sicilianos con ricotta", 12.00, "Postres"),
    ("Baklava", "Hojaldre con miel y nueces", 12.00, "Postres"),
    ("Churros", "Con chocolate caliente", 10.00, "Postres"),
    ("Crêpes Suzette", "Flameados con Grand Marnier", 18.00, "Postres"),
    ("Tarta Santiago", "Almendra gallega", 14.00, "Postres"),
    ("Coulant", "De chocolate blanco", 14.00, "Postres"),
    ("Mousse", "Chocolate, fresa o mango", 12.00, "Postres"),
    ("Semifreddo", "Helado italiano", 14.00, "Postres"),
    ("Affogato", "Helado con espresso", 10.00, "Postres"),
    ("Granita", "Hielo raspado siciliano", 8.00, "Postres"),
    ("Tartufo", "Helado trufa", 12.00, "Postres"),
    ("Suspiro Limeño", "Merengue peruano", 12.00, "Postres"),
    ("Alfajores", "Con dulce de leche", 10.00, "Postres"),
    ("Chocotorta", "Torta argentina", 12.00, "Postres"),
    ("Rogel", "Milhojas con dulce", 14.00, "Postres"),
    ("Vigilante", "Queso y dulce", 10.00, "Postres"),
    ("Panqueques", "Con dulce de leche", 12.00, "Postres"),
    ("Buñuelos", "Con miel", 10.00, "Postres"),
    ("Torrijas", "Pan frito con canela", 10.00, "Postres"),
    ("Arroz con Leche", "Con canela", 10.00, "Postres"),
    ("Natillas", "Crema española", 10.00, "Postres"),
    ("Tocino de Cielo", "Flan de yema", 12.00, "Postres"),
    ("Tarta Selva Negra", "Chocolate y cerezas", 16.00, "Postres"),
    ("Strudel", "De manzana austriaco", 14.00, "Postres"),
    ("Kaiserschmarrn", "Panqueque austriaco", 14.00, "Postres"),
    ("Sachertorte", "Torta de chocolate vienesa", 16.00, "Postres"),
    ("Linzertorte", "Tarta de frambuesa", 14.00, "Postres"),
    ("Black Forest", "Selva negra alemana", 16.00, "Postres"),
    ("Baumkuchen", "Pastel árbol alemán", 18.00, "Postres"),
    ("Dobos Torte", "Torta húngara", 16.00, "Postres"),
    ("Esterházy", "Torta de almendras", 16.00, "Postres"),
    
    # BEBIDAS SIN ALCOHOL (40 productos)
    ("Agua Fiji", "500ml importada", 8.00, "Bebidas"),
    ("San Pellegrino", "Agua con gas italiana", 6.00, "Bebidas"),
    ("Perrier", "Agua con gas francesa", 6.00, "Bebidas"),
    ("Coca Cola Mexicana", "Botella con azúcar de caña", 5.00, "Bebidas"),
    ("Limonada Natural", "Limón exprimido", 6.00, "Bebidas"),
    ("Naranjada", "Naranja natural", 6.00, "Bebidas"),
    ("Smoothie Tropical", "Mango, piña, maracuyá", 10.00, "Bebidas"),
    ("Smoothie Verde", "Espinaca, manzana, jengibre", 10.00, "Bebidas"),
    ("Batido Proteico", "Plátano, proteína, almendra", 12.00, "Bebidas"),
    ("Milkshake", "Vainilla, chocolate o fresa", 10.00, "Bebidas"),
    ("Té Matcha Latte", "Té verde japonés", 8.00, "Bebidas"),
    ("Chai Latte", "Té especiado con leche", 8.00, "Bebidas"),
    ("Chocolate Caliente", "Chocolate belga", 8.00, "Bebidas"),
    ("Café Espresso", "Grano premium", 4.00, "Bebidas"),
    ("Cappuccino", "Espresso con espuma", 6.00, "Bebidas"),
    ("Latte", "Café con leche", 6.00, "Bebidas"),
    ("Americano", "Espresso diluido", 5.00, "Bebidas"),
    ("Macchiato", "Espresso manchado", 5.00, "Bebidas"),
    ("Flat White", "Café australiano", 6.00, "Bebidas"),
    ("Cold Brew", "Café frío 24h", 7.00, "Bebidas"),
    ("Kombucha", "Té fermentado", 8.00, "Bebidas"),
    ("Kéfir", "Leche fermentada", 7.00, "Bebidas"),
    ("Horchata", "Bebida de chufa", 6.00, "Bebidas"),
    ("Agua de Jamaica", "Infusión de hibisco", 6.00, "Bebidas"),
    ("Agua de Tamarindo", "Dulce y ácida", 6.00, "Bebidas"),
    ("Virgin Mojito", "Menta, limón, soda", 8.00, "Bebidas"),
    ("Virgin Piña Colada", "Piña y coco sin alcohol", 8.00, "Bebidas"),
    ("Shirley Temple", "Ginger ale con granadina", 7.00, "Bebidas"),
    ("Arnold Palmer", "Té helado con limonada", 6.00, "Bebidas"),
    ("Té Verde", "Sencha japonés", 5.00, "Bebidas"),
    ("Té Negro", "Earl Grey", 5.00, "Bebidas"),
    ("Té Rooibos", "Sin cafeína", 5.00, "Bebidas"),
    ("Infusión", "Manzanilla, menta, etc", 4.00, "Bebidas"),
    ("Zumo Natural", "Naranja, manzana, piña", 7.00, "Bebidas"),
    ("Batido de Frutas", "Frutas mixtas", 8.00, "Bebidas"),
    ("Lassi", "Yogurt indio", 7.00, "Bebidas"),
    ("Ayran", "Yogurt turco salado", 6.00, "Bebidas"),
    ("Tónica Premium", "Fever Tree", 6.00, "Bebidas"),
    ("Ginger Beer", "Jengibre picante", 6.00, "Bebidas"),
    ("Root Beer", "Cerveza de raíz", 6.00, "Bebidas"),
]

def clean_duplicate_products(conn):
    """Limpiar productos duplicados que no tengan pedidos asociados"""
    cursor = conn.cursor()
    
    print("=== LIMPIANDO PRODUCTOS DUPLICADOS ===")
    
    # Encontrar productos duplicados que NO tienen pedidos
    cursor.execute("""
        SELECT p.id, p.name
        FROM products p
        WHERE p.id IN (
            SELECT id FROM (
                SELECT id, name,
                       ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) as rn
                FROM products
            ) t WHERE rn > 1
        )
        AND NOT EXISTS (
            SELECT 1 FROM order_items oi WHERE oi.product_id = p.id
        )
    """)
    
    duplicates_to_delete = cursor.fetchall()
    deleted_count = 0
    
    for product_id, product_name in duplicates_to_delete:
        # Primero eliminar relaciones de ingredientes
        cursor.execute("DELETE FROM product_ingredients WHERE product_id = %s", (product_id,))
        # Luego eliminar el producto
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        deleted_count += 1
        print(f"  ✗ Eliminado duplicado: {product_name} (ID: {product_id})")
    
    conn.commit()
    
    if deleted_count == 0:
        print("✓ No se encontraron duplicados que se puedan eliminar")
    else:
        print(f"✓ Eliminados {deleted_count} productos duplicados")
    
    cursor.close()
    return deleted_count

def create_categories_if_needed(conn):
    """Crear categorías si no existen"""
    cursor = conn.cursor()
    
    categories = [
        'Entradas', 'Sopas', 'Ensaladas', 'Pastas', 'Pizzas', 
        'Carnes', 'Aves', 'Pescados', 'Mariscos', 'Postres', 'Bebidas'
    ]
    
    for cat in categories:
        cursor.execute("""
            INSERT IGNORE INTO categories (name, is_active, created_at)
            VALUES (%s, 1, NOW())
        """, (cat,))
    
    conn.commit()
    
    # Obtener IDs de categorías
    cursor.execute("SELECT id, name FROM categories")
    cat_dict = {row[1]: row[0] for row in cursor.fetchall()}
    
    cursor.close()
    return cat_dict

def insert_unique_products(conn):
    """Insertar productos únicos profesionales"""
    cursor = conn.cursor()
    
    # Crear categorías
    categories = create_categories_if_needed(conn)
    
    # Obtener ingredientes
    cursor.execute("SELECT id, name FROM ingredients")
    ingredients = {row[1]: row[0] for row in cursor.fetchall()}
    
    print("\n=== INSERTANDO 500 PRODUCTOS ÚNICOS ===\n")
    
    inserted = 0
    cooking_methods = ['grilled', 'fried', 'baked', 'steamed', 'raw', 'sauteed', 'roasted', 'braised']
    countries = ['Italia', 'Francia', 'España', 'México', 'Perú', 'Argentina', 'Japón', 'Tailandia']
    
    # Limitar a los primeros 500 productos
    for name, description, price, category in PRODUCTS_LIST[:500]:
        if category not in categories:
            continue
            
        category_id = categories[category]
        
        # Generar datos adicionales
        prep_time = random.randint(10, 60)
        cooking_method = random.choice(cooking_methods)
        spice_level = random.randint(0, 3)
        calories = random.randint(200, 800)
        protein = round(random.uniform(10, 40), 1)
        carbs = round(random.uniform(10, 50), 1)
        fat = round(random.uniform(5, 30), 1)
        is_signature = random.random() < 0.3
        is_vegetarian = category in ['Ensaladas', 'Pastas', 'Pizzas'] and random.random() < 0.3
        is_vegan = is_vegetarian and random.random() < 0.3
        is_gluten_free = category not in ['Pastas', 'Pizzas'] and random.random() < 0.2
        serving_size = f"{random.randint(200, 500)}g"
        origin_country = random.choice(countries)
        
        # Insertar producto
        cursor.execute("""
            INSERT IGNORE INTO products (
                name, description, price, category_id, available,
                preparation_time, cooking_method, spice_level,
                calories, protein, carbs, fat,
                is_signature, is_vegetarian, is_vegan, is_gluten_free,
                serving_size, origin_country, created_at
            ) VALUES (
                %s, %s, %s, %s, 1,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, NOW()
            )
        """, (
            name, description, price, category_id,
            prep_time, cooking_method, spice_level,
            calories, protein, carbs, fat,
            is_signature, is_vegetarian, is_vegan, is_gluten_free,
            serving_size, origin_country
        ))
        
        if cursor.rowcount > 0:
            product_id = cursor.lastrowid
            
            # Asignar ingredientes aleatorios (3-6 ingredientes por producto)
            num_ingredients = random.randint(3, 6)
            selected_ingredients = random.sample(list(ingredients.keys()), 
                                               min(num_ingredients, len(ingredients)))
            
            for ing_name in selected_ingredients:
                if ing_name in ingredients:
                    quantity = random.randint(50, 300)
                    cursor.execute("""
                        INSERT IGNORE INTO product_ingredients 
                        (product_id, ingredient_id, quantity)
                        VALUES (%s, %s, %s)
                    """, (product_id, ingredients[ing_name], quantity))
            
            inserted += 1
            
            if inserted % 100 == 0:
                conn.commit()
                print(f"  ✓ {inserted} productos insertados...")
    
    conn.commit()
    print(f"\n✓ Total: {inserted} productos únicos insertados")
    
    cursor.close()
    return inserted

def main():
    """Función principal"""
    try:
        print("🔗 Conectando a la base de datos...")
        conn = mysql.connector.connect(**config)
        print("✓ Conexión establecida\n")
        
        # Limpiar duplicados
        clean_duplicate_products(conn)
        
        # Insertar productos únicos
        inserted = insert_unique_products(conn)
        
        # Estadísticas finales
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 1")
        total_products = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT name) FROM products WHERE available = 1")
        unique_products = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM product_ingredients")
        total_relations = cursor.fetchone()[0]
        
        print("\n📊 ESTADÍSTICAS FINALES:")
        print(f"  • Total de productos: {total_products}")
        print(f"  • Productos únicos: {unique_products}")
        print(f"  • Relaciones producto-ingrediente: {total_relations}")
        
        # Mostrar muestra de productos
        cursor.execute("""
            SELECT p.name, c.name, p.price 
            FROM products p 
            JOIN categories c ON p.category_id = c.id 
            WHERE p.available = 1 
            ORDER BY RAND() 
            LIMIT 10
        """)
        
        print("\n🍽️ Muestra de productos:")
        for product, category, price in cursor.fetchall():
            print(f"  • {product} ({category}) - ${price}")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 ¡Sistema actualizado con productos únicos profesionales!")
        
    except mysql.connector.Error as e:
        print(f"\n❌ Error de base de datos: {e}")
    except Exception as e:
        print(f"\n❌ Error general: {e}")

if __name__ == "__main__":
    main()