#!/usr/bin/env python3
"""
Script simplificado para insertar 500 productos únicos sin duplicados
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

# Lista de 500 productos únicos profesionales
PRODUCTS_LIST = [
    # ENTRADAS (50 productos)
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
    ("Gazpacho Andaluz", "Sopa fría de tomate y vegetales", 12.00, "Entradas"),
    ("Salmorejo Cordobés", "Crema fría de tomate con jamón y huevo", 14.00, "Entradas"),
    ("Tortilla Española", "Tortilla de papas tradicional", 16.00, "Entradas"),
    ("Patatas Bravas", "Papas fritas con salsa brava y alioli", 12.00, "Entradas"),
    ("Pinchos Morunos", "Brochetas de cerdo especiadas", 18.00, "Entradas"),
    ("Albóndigas en Salsa", "Albóndigas caseras en salsa de tomate", 16.00, "Entradas"),
    ("Hummus Libanés", "Puré de garbanzos con tahini", 12.00, "Entradas"),
    ("Baba Ganoush", "Puré de berenjena asada con tahini", 14.00, "Entradas"),
    ("Falafel", "Croquetas de garbanzo con salsa tahini", 14.00, "Entradas"),
    ("Tabulé", "Ensalada de bulgur con perejil y menta", 12.00, "Entradas"),
    ("Dolmas", "Hojas de parra rellenas de arroz", 16.00, "Entradas"),
    ("Kibbeh", "Croquetas de bulgur y carne", 18.00, "Entradas"),
    ("Samosas Vegetales", "Empanadillas indias de verduras", 14.00, "Entradas"),
    ("Spring Rolls", "Rollitos primavera vietnamitas", 16.00, "Entradas"),
    ("Gyozas", "Empanadillas japonesas al vapor", 18.00, "Entradas"),
    ("Edamame", "Vainas de soja con sal marina", 10.00, "Entradas"),
    ("Tempura de Verduras", "Verduras en tempura ligera", 16.00, "Entradas"),
    ("Sushi Roll California", "Roll de cangrejo y aguacate", 22.00, "Entradas"),
    ("Nigiri Mixto", "6 piezas de nigiri variado", 28.00, "Entradas"),
    ("Sashimi de Salmón", "Láminas de salmón fresco", 26.00, "Entradas"),
    
    # PLATOS PRINCIPALES (100 productos)
    ("Bife de Chorizo", "400g de corte argentino premium", 82.00, "Platos Principales"),
    ("Ojo de Bife", "350g con papas rústicas", 78.00, "Platos Principales"),
    ("Lomo Wellington", "Envuelto en hojaldre con duxelles", 95.00, "Platos Principales"),
    ("Costillas BBQ", "Costillas de cerdo con salsa barbacoa", 58.00, "Platos Principales"),
    ("Pollo al Curry Thai", "Con leche de coco y vegetales", 42.00, "Platos Principales"),
    ("Salmón Teriyaki", "Con arroz jazmín y vegetales wok", 56.00, "Platos Principales"),
    ("Lubina a la Sal", "Lubina entera en costra de sal", 68.00, "Platos Principales"),
    ("Paella Valenciana", "Para dos personas", 75.00, "Platos Principales"),
    ("Risotto de Mariscos", "Con frutos del mar frescos", 62.00, "Platos Principales"),
    ("Ossobuco alla Milanese", "Con risotto azafranado", 72.00, "Platos Principales"),
    ("Magret de Pato", "Con salsa de frutos rojos", 68.00, "Platos Principales"),
    ("Rack de Cordero", "Con costra de hierbas", 85.00, "Platos Principales"),
    ("Pescado del Día", "Según mercado con guarnición", 48.00, "Platos Principales"),
    ("Pollo Parmigiana", "Con pasta al pomodoro", 45.00, "Platos Principales"),
    ("Escalope Vienés", "Con ensalada de papas", 52.00, "Platos Principales"),
    ("Conejo al Romero", "Con papas asadas", 58.00, "Platos Principales"),
    ("Codornices Asadas", "Con reducción de vino tinto", 62.00, "Platos Principales"),
    ("Pulpo Gallego", "Con papas y pimentón", 65.00, "Platos Principales"),
    ("Bacalao al Pil Pil", "Con emulsión de ajo", 70.00, "Platos Principales"),
    ("Merluza a la Vasca", "Con almejas y espárragos", 55.00, "Platos Principales"),
    ("Robalo en Costra de Sal", "Con verduras al vapor", 72.00, "Platos Principales"),
    ("Atún Sellado", "Con costra de sésamo", 68.00, "Platos Principales"),
    ("Langostinos Jumbo", "A la plancha con ajo", 78.00, "Platos Principales"),
    ("Bogavante Thermidor", "Gratinado con salsa cremosa", 120.00, "Platos Principales"),
    ("Chateaubriand", "Para dos personas", 160.00, "Platos Principales"),
    ("T-Bone Steak", "500g con guarniciones", 95.00, "Platos Principales"),
    ("Tomahawk", "1kg para compartir", 180.00, "Platos Principales"),
    ("Picanha", "Con farofa y vinagreta", 75.00, "Platos Principales"),
    ("Entraña", "Con chimichurri", 68.00, "Platos Principales"),
    ("Matambre a la Pizza", "Relleno gratinado", 55.00, "Platos Principales"),
    ("Vacío", "Con salsa criolla", 62.00, "Platos Principales"),
    ("Bife de Lomo", "Con salsa de pimienta", 88.00, "Platos Principales"),
    ("Milanesa Napolitana", "Con jamón y queso", 48.00, "Platos Principales"),
    ("Suprema Maryland", "Con banana y choclo", 45.00, "Platos Principales"),
    ("Bondiola a la Cerveza", "Cocción lenta", 58.00, "Platos Principales"),
    ("Lechón Confitado", "Con batatas glaseadas", 62.00, "Platos Principales"),
    ("Cabrito al Horno", "Con papas y cebolla", 70.00, "Platos Principales"),
    ("Pato Pekín", "Con crepes y salsa hoisin", 75.00, "Platos Principales"),
    ("Pollo Tandoori", "Marinado en especias", 48.00, "Platos Principales"),
    ("Lamb Korma", "Cordero en salsa cremosa", 65.00, "Platos Principales"),
    ("Beef Stroganoff", "Con papas noisette", 58.00, "Platos Principales"),
    ("Goulash Húngaro", "Estofado con paprika", 52.00, "Platos Principales"),
    ("Coq au Vin", "Pollo al vino tinto", 55.00, "Platos Principales"),
    ("Bouillabaisse", "Sopa de pescados marsellesa", 68.00, "Platos Principales"),
    ("Cassoulet", "Guiso de alubias y pato", 62.00, "Platos Principales"),
    ("Choucroute", "Chucrut con embutidos", 58.00, "Platos Principales"),
    ("Moussaka", "Lasaña griega de berenjena", 48.00, "Platos Principales"),
    ("Souvlaki", "Brochetas griegas mixtas", 52.00, "Platos Principales"),
    ("Beef Bourguignon", "Estofado de res al vino", 65.00, "Platos Principales"),
    ("Ratatouille", "Guiso provenzal de verduras", 38.00, "Platos Principales"),
    ("Pad Thai", "Fideos salteados tailandeses", 42.00, "Platos Principales"),
    ("Pho Bo", "Sopa vietnamita de res", 38.00, "Platos Principales"),
    ("Bibimbap", "Bowl coreano mixto", 45.00, "Platos Principales"),
    ("Ramen Tonkotsu", "Sopa japonesa de cerdo", 42.00, "Platos Principales"),
    ("Kung Pao Chicken", "Pollo picante sichuanés", 48.00, "Platos Principales"),
    ("Pato Laqueado", "Estilo cantonés", 72.00, "Platos Principales"),
    ("Dim Sum Variado", "Selección de 12 piezas", 55.00, "Platos Principales"),
    ("Sichuan Fish", "Pescado en salsa picante", 62.00, "Platos Principales"),
    ("Mapo Tofu", "Tofu en salsa picante", 35.00, "Platos Principales"),
    ("Chow Mein", "Fideos salteados con vegetales", 38.00, "Platos Principales"),
    ("Sweet & Sour Pork", "Cerdo agridulce", 45.00, "Platos Principales"),
    ("General Tso's Chicken", "Pollo crujiente en salsa", 48.00, "Platos Principales"),
    ("Mongolian Beef", "Res salteada con cebollín", 55.00, "Platos Principales"),
    ("Orange Chicken", "Pollo a la naranja", 45.00, "Platos Principales"),
    ("Szechuan Shrimp", "Camarones picantes", 58.00, "Platos Principales"),
    ("Moo Shu Pork", "Cerdo con vegetales y crepes", 48.00, "Platos Principales"),
    ("Peking Duck", "Pato pekinés tradicional", 85.00, "Platos Principales"),
    ("Cashew Chicken", "Pollo con castañas de cajú", 45.00, "Platos Principales"),
    ("Honey Walnut Shrimp", "Camarones con nueces", 62.00, "Platos Principales"),
    ("Fish Fragrant Eggplant", "Berenjena en salsa aromática", 38.00, "Platos Principales"),
    ("Dan Dan Noodles", "Fideos picantes sichuaneses", 35.00, "Platos Principales"),
    ("Hot Pot", "Fondue china para dos", 95.00, "Platos Principales"),
    ("Xiao Long Bao", "8 dumplings de sopa", 32.00, "Platos Principales"),
    ("Char Siu", "Cerdo BBQ cantonés", 52.00, "Platos Principales"),
    ("Twice Cooked Pork", "Cerdo dos veces cocido", 48.00, "Platos Principales"),
    ("Tea Smoked Duck", "Pato ahumado al té", 68.00, "Platos Principales"),
    ("Lion's Head", "Albóndigas gigantes", 45.00, "Platos Principales"),
    ("Beggar's Chicken", "Pollo en arcilla", 75.00, "Platos Principales"),
    ("Steamed Whole Fish", "Pescado entero al vapor", 65.00, "Platos Principales"),
    ("Buddha's Delight", "Vegetales mixtos salteados", 32.00, "Platos Principales"),
    ("Lamb Biryani", "Arroz especiado con cordero", 58.00, "Platos Principales"),
    ("Chicken Tikka Masala", "Pollo en salsa cremosa", 48.00, "Platos Principales"),
    ("Palak Paneer", "Espinacas con queso indio", 38.00, "Platos Principales"),
    ("Vindaloo", "Curry picante de cerdo", 52.00, "Platos Principales"),
    ("Butter Chicken", "Pollo en salsa de manteca", 45.00, "Platos Principales"),
    ("Dal Makhani", "Lentejas cremosas", 32.00, "Platos Principales"),
    ("Rogan Josh", "Cordero en salsa aromática", 62.00, "Platos Principales"),
    ("Malai Kofta", "Albóndigas vegetales en crema", 38.00, "Platos Principales"),
    ("Fish Curry", "Pescado en curry de coco", 55.00, "Platos Principales"),
    ("Prawn Masala", "Langostinos en salsa especiada", 62.00, "Platos Principales"),
    ("Chana Masala", "Garbanzos al curry", 32.00, "Platos Principales"),
    ("Aloo Gobi", "Coliflor y papas especiadas", 35.00, "Platos Principales"),
    ("Baingan Bharta", "Berenjena asada especiada", 35.00, "Platos Principales"),
    ("Saag Gosht", "Cordero con espinacas", 58.00, "Platos Principales"),
    ("Hyderabadi Biryani", "Arroz aromático con pollo", 52.00, "Platos Principales"),
    ("Kadai Chicken", "Pollo con pimientos", 45.00, "Platos Principales"),
    ("Mutton Curry", "Curry de carnero", 65.00, "Platos Principales"),
    ("Prawn Biryani", "Arroz con langostinos", 68.00, "Platos Principales"),
    ("Chicken 65", "Pollo frito picante", 42.00, "Platos Principales"),
    ("Dosa Masala", "Crepe de lentejas relleno", 28.00, "Platos Principales"),
    
    # PASTAS (80 productos)
    ("Spaghetti Carbonara", "Con guanciale y pecorino romano", 32.00, "Pastas"),
    ("Fettuccine Alfredo", "Con crema y parmesano", 30.00, "Pastas"),
    ("Penne Arrabbiata", "Con salsa picante de tomate", 28.00, "Pastas"),
    ("Linguine alle Vongole", "Con almejas y vino blanco", 38.00, "Pastas"),
    ("Tagliatelle al Tartufo", "Con trufa negra rallada", 68.00, "Pastas"),
    ("Rigatoni Amatriciana", "Con guanciale y tomate", 32.00, "Pastas"),
    ("Bucatini all'Amatriciana", "Pasta tradicional romana", 34.00, "Pastas"),
    ("Orecchiette con Broccoli", "Con anchoas y ajo", 30.00, "Pastas"),
    ("Pappardelle al Ragù", "Con ragú de 8 horas", 36.00, "Pastas"),
    ("Tortellini en Brodo", "En caldo de capón", 32.00, "Pastas"),
    ("Ravioli di Zucca", "Rellenos de calabaza", 34.00, "Pastas"),
    ("Agnolotti del Plin", "Pasta rellena piamontesa", 38.00, "Pastas"),
    ("Cacio e Pepe", "Con pecorino y pimienta", 28.00, "Pastas"),
    ("Pasta alla Norma", "Con berenjena y ricotta", 30.00, "Pastas"),
    ("Spaghetti Aglio e Olio", "Con ajo y guindilla", 26.00, "Pastas"),
    ("Lasagna Bolognese", "Tradicional con bechamel", 35.00, "Pastas"),
    ("Cannelloni Ricotta", "Con espinacas y ricotta", 32.00, "Pastas"),
    ("Gnocchi Sorrentina", "Con tomate y mozzarella", 30.00, "Pastas"),
    ("Trofie al Pesto", "Con pesto genovés", 32.00, "Pastas"),
    ("Mezze Maniche all'Arrabbiata", "Pasta corta picante", 28.00, "Pastas"),
    ("Paccheri con Frutti di Mare", "Con mariscos mixtos", 45.00, "Pastas"),
    ("Strozzapreti alla Boscaiola", "Con setas y panceta", 34.00, "Pastas"),
    ("Fusilli al Pomodoro", "Con tomate San Marzano", 26.00, "Pastas"),
    ("Farfalle al Salmone", "Con salmón y crema", 36.00, "Pastas"),
    ("Conchiglie Ripiene", "Caracolas rellenas", 34.00, "Pastas"),
    ("Maccheroni al Ferretto", "Pasta artesanal calabresa", 32.00, "Pastas"),
    ("Bigoli in Salsa", "Con anchoas venecianas", 30.00, "Pastas"),
    ("Culurgiones", "Ravioles sardos", 36.00, "Pastas"),
    ("Pizzoccheri", "Pasta de trigo sarraceno", 34.00, "Pastas"),
    ("Malloreddus", "Pasta sarda con azafrán", 32.00, "Pastas"),
    ("Busiate al Pesto Trapanese", "Con pesto siciliano", 30.00, "Pastas"),
    ("Casarecce alla Norma", "Pasta siciliana con berenjena", 32.00, "Pastas"),
    ("Garganelli con Prosciutto", "Con jamón y arvejas", 34.00, "Pastas"),
    ("Gramigna con Salsiccia", "Con salchicha italiana", 32.00, "Pastas"),
    ("Lumache con Gorgonzola", "Caracoles con queso azul", 34.00, "Pastas"),
    ("Maltagliati con Fagioli", "Con alubias", 28.00, "Pastas"),
    ("Passatelli in Brodo", "Pasta de pan en caldo", 30.00, "Pastas"),
    ("Pisarei e Fasò", "Con alubias piacentinas", 32.00, "Pastas"),
    ("Scialatielli ai Frutti di Mare", "Pasta de Amalfi", 42.00, "Pastas"),
    ("Spaghetti alla Chitarra", "Pasta abruzzese", 30.00, "Pastas"),
    ("Strangozzi al Tartufo", "Con trufa umbra", 65.00, "Pastas"),
    ("Testaroli al Pesto", "Pasta de Lunigiana", 32.00, "Pastas"),
    ("Tonnarelli Cacio e Pepe", "Versión romana", 30.00, "Pastas"),
    ("Umbricelli all'Aglione", "Con ajo gigante", 28.00, "Pastas"),
    ("Vermicelli alle Vongole", "Con almejas veraci", 38.00, "Pastas"),
    ("Ziti alla Genovese", "Con cebolla caramelizada", 30.00, "Pastas"),
    ("Bavette al Pesto", "Pasta ligur con pesto", 32.00, "Pastas"),
    ("Cavatappi Quattro Formaggi", "Con cuatro quesos", 34.00, "Pastas"),
    ("Ditalini con Lenticchie", "Con lentejas", 28.00, "Pastas"),
    ("Fregula con Arselle", "Pasta sarda con almejas", 36.00, "Pastas"),
    ("Gemelli all'Ortolana", "Con verduras de temporada", 30.00, "Pastas"),
    ("Lasagnette con Funghi", "Con setas porcini", 36.00, "Pastas"),
    ("Mafaldine al Ragù Napoletano", "Ragú napolitano", 34.00, "Pastas"),
    ("Nidi di Rondine", "Nidos con ricotta", 32.00, "Pastas"),
    ("Occhi di Lupo Arrabiata", "Pasta tubular picante", 28.00, "Pastas"),
    ("Pici all'Aglione", "Pasta toscana con ajo", 30.00, "Pastas"),
    ("Quadrucci in Brodo", "Cuadraditos en caldo", 26.00, "Pastas"),
    ("Reginette con Melanzane", "Con berenjenas fritas", 32.00, "Pastas"),
    ("Sedanini Rigati", "Con salsa de nueces", 30.00, "Pastas"),
    ("Stelline in Brodo", "Estrellitas en caldo", 24.00, "Pastas"),
    ("Tagliolini al Limone", "Con limón de Amalfi", 32.00, "Pastas"),
    ("Trenette al Pesto", "Especialidad ligur", 32.00, "Pastas"),
    ("Trofiette con Fagiolini", "Con judías verdes", 30.00, "Pastas"),
    ("Tubetti con Cozze", "Con mejillones", 34.00, "Pastas"),
    ("Vermicelloni Gricia", "Con guanciale y pecorino", 32.00, "Pastas"),
    ("Zitoni con Ragù", "Pasta grande con ragú", 34.00, "Pastas"),
    ("Anelli Siciliani", "Anillos al horno", 30.00, "Pastas"),
    ("Bombardoni all'Astice", "Con bogavante", 65.00, "Pastas"),
    ("Calamarata con Calamari", "Con calamares", 38.00, "Pastas"),
    ("Campanelle Primavera", "Con verduras de primavera", 30.00, "Pastas"),
    ("Candele Spezzate", "Pasta rota con tomate", 28.00, "Pastas"),
    ("Cappelletti in Brodo", "Sombrerillos en caldo", 32.00, "Pastas"),
    ("Casoncelli Bergamaschi", "Ravioles de Bérgamo", 36.00, "Pastas"),
    ("Cavatelli con Cime di Rapa", "Con grelos", 30.00, "Pastas"),
    ("Cencioni con Funghi", "Con setas mixtas", 34.00, "Pastas"),
    ("Chitarrine all'Uovo", "Pasta al huevo", 32.00, "Pastas"),
    ("Ciriole alla Ternana", "Pasta de Umbría", 30.00, "Pastas"),
    ("Corzetti con Pesto", "Medallones con pesto", 32.00, "Pastas"),
    ("Creste di Gallo", "Crestas de gallo con verduras", 30.00, "Pastas"),
    ("Dischi Volanti", "Discos con mariscos", 36.00, "Pastas"),
    
    # PIZZAS (70 productos)
    ("Margherita", "Tomate, mozzarella, albahaca", 22.00, "Pizzas"),
    ("Marinara", "Tomate, ajo, orégano", 20.00, "Pizzas"),
    ("Napolitana", "Tomate, mozzarella, anchoas", 24.00, "Pizzas"),
    ("Quattro Stagioni", "Cuatro estaciones", 28.00, "Pizzas"),
    ("Quattro Formaggi", "Cuatro quesos", 26.00, "Pizzas"),
    ("Prosciutto e Funghi", "Jamón y champiñones", 25.00, "Pizzas"),
    ("Diavola", "Pepperoni picante", 24.00, "Pizzas"),
    ("Capricciosa", "Jamón, champiñones, alcachofas", 26.00, "Pizzas"),
    ("Calzone", "Pizza cerrada rellena", 24.00, "Pizzas"),
    ("Frutti di Mare", "Mariscos mixtos", 32.00, "Pizzas"),
    ("Vegetariana", "Vegetales de temporada", 23.00, "Pizzas"),
    ("Romana", "Tomate, mozzarella, anchoas, alcaparras", 25.00, "Pizzas"),
    ("Siciliana", "Tomate, mozzarella, berenjenas, ricotta", 26.00, "Pizzas"),
    ("Pugliese", "Tomate, mozzarella, cebolla", 22.00, "Pizzas"),
    ("Boscaiola", "Setas mixtas y panceta", 28.00, "Pizzas"),
    ("Tonnara", "Atún y cebolla", 26.00, "Pizzas"),
    ("Bresaola", "Bresaola, rúcula, parmesano", 30.00, "Pizzas"),
    ("Tartufo", "Trufa negra y mozzarella", 45.00, "Pizzas"),
    ("Mortadella", "Mortadella, pistachos, burrata", 32.00, "Pizzas"),
    ("Nduja", "Embutido picante calabrés", 28.00, "Pizzas"),
    ("Gorgonzola e Pere", "Gorgonzola y peras", 28.00, "Pizzas"),
    ("Salmone", "Salmón ahumado y rúcula", 32.00, "Pizzas"),
    ("Carbonara", "Guanciale, huevo, pecorino", 28.00, "Pizzas"),
    ("Parmigiana", "Berenjenas a la parmesana", 26.00, "Pizzas"),
    ("Caprese", "Tomate cherry, mozzarella de búfala", 28.00, "Pizzas"),
    ("Ortolana", "Vegetales grillados", 24.00, "Pizzas"),
    ("Salsiccia e Friarielli", "Salchicha y grelos", 28.00, "Pizzas"),
    ("Bianca", "Base blanca sin tomate", 22.00, "Pizzas"),
    ("Focaccia", "Pan plano con romero", 18.00, "Pizzas"),
    ("Pinsa Romana", "Masa romana antigua", 26.00, "Pizzas"),
    ("Pizza al Taglio", "Pizza al corte", 20.00, "Pizzas"),
    ("Pizza Fritta", "Pizza frita napolitana", 24.00, "Pizzas"),
    ("Sfincione", "Pizza siciliana gruesa", 26.00, "Pizzas"),
    ("Pizza al Padellino", "Pizza en sartén", 22.00, "Pizzas"),
    ("Metro Pizza", "Pizza de un metro", 65.00, "Pizzas"),
    ("Pizza Gourmet", "Ingredientes premium", 38.00, "Pizzas"),
    ("Montanara", "Pizza frita con tomate", 24.00, "Pizzas"),
    ("Scugnizzo", "Pizza enrollada", 20.00, "Pizzas"),
    ("Ripieno", "Pizza rellena", 26.00, "Pizzas"),
    ("Stella", "Pizza estrella con bordes rellenos", 28.00, "Pizzas"),
    ("Doppia Crosta", "Doble corteza rellena", 30.00, "Pizzas"),
    ("Vulcano", "Forma de volcán relleno", 32.00, "Pizzas"),
    ("Integrale", "Masa integral", 24.00, "Pizzas"),
    ("Senza Glutine", "Sin gluten", 26.00, "Pizzas"),
    ("Vegana", "Queso vegano", 25.00, "Pizzas"),
    ("Proteica", "Alta en proteínas", 28.00, "Pizzas"),
    ("Keto", "Baja en carbohidratos", 30.00, "Pizzas"),
    ("Dolce", "Pizza dulce de Nutella", 22.00, "Pizzas"),
    ("Breakfast Pizza", "Pizza de desayuno", 24.00, "Pizzas"),
    ("BBQ Chicken", "Pollo con salsa BBQ", 28.00, "Pizzas"),
    ("Hawaiian", "Jamón y piña", 26.00, "Pizzas"),
    ("Mexican", "Jalapeños y carne picada", 28.00, "Pizzas"),
    ("Greek", "Feta, aceitunas, tomate", 26.00, "Pizzas"),
    ("Indian", "Pollo tikka masala", 30.00, "Pizzas"),
    ("Thai", "Inspiración tailandesa", 32.00, "Pizzas"),
    ("Japanese", "Teriyaki y algas", 34.00, "Pizzas"),
    ("Surf & Turf", "Mar y tierra", 38.00, "Pizzas"),
    ("Truffle Shuffle", "Triple trufa", 55.00, "Pizzas"),
    ("Cheese Lovers", "6 tipos de queso", 32.00, "Pizzas"),
    ("Meat Feast", "5 tipos de carne", 35.00, "Pizzas"),
    ("Garden Party", "10 vegetales diferentes", 28.00, "Pizzas"),
    ("Ocean's Eleven", "11 tipos de mariscos", 45.00, "Pizzas"),
    ("Spicy Challenge", "La más picante", 30.00, "Pizzas"),
    ("Gold Leaf", "Con hoja de oro", 85.00, "Pizzas"),
    ("Black Pizza", "Masa de carbón activado", 32.00, "Pizzas"),
    ("Rainbow", "7 colores diferentes", 34.00, "Pizzas"),
    ("Breakfast Club", "Huevos y bacon", 26.00, "Pizzas"),
    ("Sweet & Savory", "Dulce y salado", 28.00, "Pizzas"),
    ("Local Special", "Ingredientes locales", 30.00, "Pizzas"),
    ("Chef's Choice", "Creación del chef", 36.00, "Pizzas"),
    ("Mystery Pizza", "Ingredientes sorpresa", 32.00, "Pizzas"),
    
    # ENSALADAS (50 productos)
    ("Caesar", "Lechuga romana, crutones, parmesano", 18.00, "Ensaladas"),
    ("Griega", "Tomate, pepino, feta, aceitunas", 16.00, "Ensaladas"),
    ("Caprese", "Tomate, mozzarella, albahaca", 20.00, "Ensaladas"),
    ("Niçoise", "Atún, huevo, anchoas, aceitunas", 22.00, "Ensaladas"),
    ("Waldorf", "Manzana, apio, nueces, mayonesa", 18.00, "Ensaladas"),
    ("Cobb", "Pollo, bacon, huevo, queso azul", 24.00, "Ensaladas"),
    ("Thai", "Papaya verde, maní, lima", 16.00, "Ensaladas"),
    ("Quinoa", "Quinoa, vegetales, vinagreta", 18.00, "Ensaladas"),
    ("Rúcula y Parmesano", "Rúcula, parmesano, tomates cherry", 16.00, "Ensaladas"),
    ("Espinaca y Fresas", "Espinacas, fresas, almendras", 18.00, "Ensaladas"),
    ("Mediterránea", "Vegetales mediterráneos mixtos", 20.00, "Ensaladas"),
    ("Asiática", "Mix asiático con sésamo", 18.00, "Ensaladas"),
    ("Mexicana", "Lechuga, maíz, frijoles, aguacate", 20.00, "Ensaladas"),
    ("Rusa", "Papa, zanahoria, arvejas, mayonesa", 14.00, "Ensaladas"),
    ("Coleslaw", "Repollo, zanahoria, mayonesa", 12.00, "Ensaladas"),
    ("Tabulé", "Bulgur, perejil, menta, tomate", 16.00, "Ensaladas"),
    ("Fattoush", "Pan pita, vegetales, sumac", 18.00, "Ensaladas"),
    ("Panzanella", "Pan toscano, tomates, albahaca", 16.00, "Ensaladas"),
    ("Lyonnaise", "Lechuga, bacon, huevo pochado", 20.00, "Ensaladas"),
    ("Andaluza", "Tomate, pimientos, huevo duro", 16.00, "Ensaladas"),
    ("Tropical", "Frutas tropicales mixtas", 18.00, "Ensaladas"),
    ("Power Salad", "Kale, quinoa, semillas", 22.00, "Ensaladas"),
    ("Detox", "Vegetales verdes, limón", 20.00, "Ensaladas"),
    ("Protein Bowl", "Alta en proteínas", 24.00, "Ensaladas"),
    ("Buddha Bowl", "Bowl vegetariano completo", 22.00, "Ensaladas"),
    ("Poke Bowl", "Pescado crudo marinado", 26.00, "Ensaladas"),
    ("Acai Bowl", "Base de acai con toppings", 20.00, "Ensaladas"),
    ("Green Goddess", "Todo verde con aderezo", 18.00, "Ensaladas"),
    ("Rainbow Salad", "7 colores de vegetales", 20.00, "Ensaladas"),
    ("Burrata Salad", "Burrata con tomates", 24.00, "Ensaladas"),
    ("Warm Goat Cheese", "Queso de cabra tibio", 22.00, "Ensaladas"),
    ("Smoked Salmon", "Salmón ahumado y eneldo", 26.00, "Ensaladas"),
    ("Prosciutto & Melon", "Jamón con melón", 24.00, "Ensaladas"),
    ("Beet & Goat Cheese", "Remolacha y queso de cabra", 20.00, "Ensaladas"),
    ("Kale Caesar", "César con kale", 20.00, "Ensaladas"),
    ("Superfood", "Superalimentos mixtos", 24.00, "Ensaladas"),
    ("Ancient Grains", "Granos antiguos", 22.00, "Ensaladas"),
    ("Roasted Vegetable", "Vegetales asados", 20.00, "Ensaladas"),
    ("Chicken Shawarma", "Pollo estilo shawarma", 24.00, "Ensaladas"),
    ("Falafel Salad", "Con falafel y tahini", 22.00, "Ensaladas"),
    ("Vietnamese", "Estilo vietnamita", 20.00, "Ensaladas"),
    ("Korean", "Con kimchi y gochujang", 22.00, "Ensaladas"),
    ("Indian", "Con especias indias", 20.00, "Ensaladas"),
    ("Moroccan", "Con cuscús y especias", 22.00, "Ensaladas"),
    ("Persian", "Con granada y nueces", 24.00, "Ensaladas"),
    ("Turkish", "Con yogurt y menta", 20.00, "Ensaladas"),
    ("Lebanese", "Con za'atar y sumac", 22.00, "Ensaladas"),
    ("Israeli", "Con hummus y tahini", 24.00, "Ensaladas"),
    ("Japanese", "Con algas y sésamo", 22.00, "Ensaladas"),
    ("Hawaiian", "Con piña y coco", 20.00, "Ensaladas"),
    
    # POSTRES (50 productos)
    ("Tiramisú", "Clásico italiano", 12.00, "Postres"),
    ("Panna Cotta", "Con frutos rojos", 10.00, "Postres"),
    ("Crème Brûlée", "Crema catalana francesa", 11.00, "Postres"),
    ("Cheesecake NY", "Tarta de queso estilo Nueva York", 12.00, "Postres"),
    ("Brownie", "Con helado de vainilla", 10.00, "Postres"),
    ("Flan", "Flan casero con caramelo", 8.00, "Postres"),
    ("Profiteroles", "Con chocolate caliente", 12.00, "Postres"),
    ("Mousse de Chocolate", "Chocolate belga 70%", 10.00, "Postres"),
    ("Tarta de Manzana", "Con helado de canela", 11.00, "Postres"),
    ("Helado Artesanal", "3 bolas a elección", 9.00, "Postres"),
    ("Soufflé", "De chocolate o Grand Marnier", 14.00, "Postres"),
    ("Mille-feuille", "Milhojas con crema pastelera", 12.00, "Postres"),
    ("Tarte Tatin", "Tarta invertida de manzana", 13.00, "Postres"),
    ("Éclair", "Relleno de crema", 8.00, "Postres"),
    ("Macarons", "6 unidades surtidas", 12.00, "Postres"),
    ("Crêpes Suzette", "Flameadas con Grand Marnier", 14.00, "Postres"),
    ("Pavlova", "Merengue con frutas", 11.00, "Postres"),
    ("Tarta de Limón", "Con merengue italiano", 10.00, "Postres"),
    ("Chocolate Lava Cake", "Volcán de chocolate", 12.00, "Postres"),
    ("Cannoli", "Rellenos de ricotta", 10.00, "Postres"),
    ("Affogato", "Helado con espresso", 8.00, "Postres"),
    ("Semifreddo", "Postre helado italiano", 11.00, "Postres"),
    ("Tres Leches", "Bizcocho empapado", 10.00, "Postres"),
    ("Churros", "Con chocolate caliente", 9.00, "Postres"),
    ("Crema Catalana", "Con azúcar quemada", 10.00, "Postres"),
    ("Baklava", "Hojaldre con miel y nueces", 11.00, "Postres"),
    ("Sticky Toffee Pudding", "Pudding inglés", 12.00, "Postres"),
    ("Eton Mess", "Merengue con frutas", 10.00, "Postres"),
    ("Banoffee Pie", "Tarta de banana y toffee", 11.00, "Postres"),
    ("Black Forest", "Selva negra", 12.00, "Postres"),
    ("Opera Cake", "Tarta ópera francesa", 13.00, "Postres"),
    ("Sachertorte", "Tarta Sacher austriaca", 12.00, "Postres"),
    ("Strudel", "De manzana con crema", 10.00, "Postres"),
    ("Kaiserschmarrn", "Panqueque austriaco", 11.00, "Postres"),
    ("Beignets", "Buñuelos de Nueva Orleans", 9.00, "Postres"),
    ("Key Lime Pie", "Tarta de lima", 11.00, "Postres"),
    ("Pecan Pie", "Tarta de nuez pecana", 12.00, "Postres"),
    ("Apple Pie", "Tarta de manzana americana", 10.00, "Postres"),
    ("Carrot Cake", "Tarta de zanahoria", 11.00, "Postres"),
    ("Red Velvet", "Tarta terciopelo rojo", 12.00, "Postres"),
    ("Lemon Tart", "Tarta de limón francesa", 11.00, "Postres"),
    ("Fruit Tart", "Tarta de frutas frescas", 12.00, "Postres"),
    ("Ice Cream Sundae", "Copa helada especial", 10.00, "Postres"),
    ("Banana Split", "Clásico americano", 11.00, "Postres"),
    ("Gelato", "Helado italiano artesanal", 8.00, "Postres"),
    ("Sorbet", "Sorbete de frutas", 7.00, "Postres"),
    ("Granita", "Granizado siciliano", 8.00, "Postres"),
    ("Zabaglione", "Crema italiana al vino", 10.00, "Postres"),
    ("Floating Island", "Isla flotante", 9.00, "Postres"),
    ("Rice Pudding", "Arroz con leche", 8.00, "Postres"),
    
    # BEBIDAS (50 productos)
    ("Agua Mineral", "San Pellegrino 500ml", 4.00, "Bebidas"),
    ("Coca Cola", "355ml", 4.50, "Bebidas"),
    ("Sprite", "355ml", 4.50, "Bebidas"),
    ("Fanta", "355ml", 4.50, "Bebidas"),
    ("Jugo de Naranja", "Natural recién exprimido", 6.00, "Bebidas"),
    ("Limonada", "Casera con menta", 5.00, "Bebidas"),
    ("Té Helado", "Durazno o limón", 5.00, "Bebidas"),
    ("Café Espresso", "Single shot", 3.00, "Bebidas"),
    ("Cappuccino", "Con leche espumada", 5.00, "Bebidas"),
    ("Latte", "Café con leche", 5.50, "Bebidas"),
    ("Americano", "Espresso con agua", 4.00, "Bebidas"),
    ("Macchiato", "Espresso manchado", 4.50, "Bebidas"),
    ("Flat White", "Café australiano", 5.50, "Bebidas"),
    ("Cortado", "Espresso con leche", 4.50, "Bebidas"),
    ("Irish Coffee", "Con whisky irlandés", 8.00, "Bebidas"),
    ("Té Earl Grey", "Con bergamota", 4.00, "Bebidas"),
    ("Té Verde", "Sencha japonés", 4.50, "Bebidas"),
    ("Té Chai", "Especiado con leche", 5.00, "Bebidas"),
    ("Chocolate Caliente", "Chocolate belga", 6.00, "Bebidas"),
    ("Milkshake", "Vainilla, chocolate o fresa", 7.00, "Bebidas"),
    ("Smoothie", "Frutas mixtas", 8.00, "Bebidas"),
    ("Mojito Virgin", "Sin alcohol", 6.00, "Bebidas"),
    ("Piña Colada Virgin", "Sin alcohol", 7.00, "Bebidas"),
    ("Shirley Temple", "Ginger ale con granadina", 5.00, "Bebidas"),
    ("Arnold Palmer", "Té helado con limonada", 5.50, "Bebidas"),
    ("Kombucha", "Té fermentado", 6.00, "Bebidas"),
    ("Agua de Coco", "Natural", 5.00, "Bebidas"),
    ("Red Bull", "Bebida energética", 6.00, "Bebidas"),
    ("Gatorade", "Bebida isotónica", 5.00, "Bebidas"),
    ("Perrier", "Agua con gas", 4.50, "Bebidas"),
    ("San Benedetto", "Té helado italiano", 5.00, "Bebidas"),
    ("Orangina", "Bebida francesa", 5.50, "Bebidas"),
    ("Ginger Ale", "Canada Dry", 4.50, "Bebidas"),
    ("Tonic Water", "Schweppes", 4.00, "Bebidas"),
    ("Club Soda", "Agua carbonatada", 3.50, "Bebidas"),
    ("Cranberry Juice", "Jugo de arándano", 5.00, "Bebidas"),
    ("Apple Juice", "Jugo de manzana", 5.00, "Bebidas"),
    ("Pineapple Juice", "Jugo de piña", 5.50, "Bebidas"),
    ("Mango Lassi", "Bebida india de mango", 6.00, "Bebidas"),
    ("Horchata", "Bebida de arroz", 5.00, "Bebidas"),
    ("Tamarindo", "Agua de tamarindo", 4.50, "Bebidas"),
    ("Jamaica", "Agua de jamaica", 4.50, "Bebidas"),
    ("Matcha Latte", "Té matcha con leche", 6.50, "Bebidas"),
    ("Golden Milk", "Leche dorada con cúrcuma", 6.00, "Bebidas"),
    ("Affogato", "Espresso con helado", 7.00, "Bebidas"),
    ("Freddo Espresso", "Espresso frío griego", 5.00, "Bebidas"),
    ("Freddo Cappuccino", "Cappuccino frío griego", 5.50, "Bebidas"),
    ("Nitro Coffee", "Café con nitrógeno", 6.00, "Bebidas"),
    ("Cold Brew", "Café en frío", 5.50, "Bebidas"),
    ("Bubble Tea", "Té con perlas de tapioca", 7.00, "Bebidas")
]

def main():
    """Función principal simplificada"""
    try:
        print("🔗 Conectando a la base de datos...")
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(buffered=True)
        print("✓ Conexión establecida\n")
        
        # Verificar categorías
        cursor.execute("SELECT name, id FROM categories")
        categories = {row[0]: row[1] for row in cursor.fetchall()}
        print(f"📁 Categorías disponibles: {list(categories.keys())}\n")
        
        # Obtener ingredientes
        cursor.execute("SELECT id, name FROM ingredients")
        ingredients = {row[1]: row[0] for row in cursor.fetchall()}
        print(f"🥘 Ingredientes disponibles: {len(ingredients)}\n")
        
        print("=== INSERTANDO 500 PRODUCTOS ÚNICOS ===\n")
        
        inserted = 0
        cooking_methods = ['grilled', 'fried', 'baked', 'steamed', 'raw', 'sauteed']
        
        for name, description, price, category in PRODUCTS_LIST:
            if category not in categories:
                print(f"⚠ Categoría '{category}' no existe, saltando: {name}")
                continue
            
            # Verificar si ya existe
            cursor.execute("SELECT id FROM products WHERE name = %s", (name,))
            result = cursor.fetchone()
            if result:
                print(f"⚠ Ya existe: {name}")
                continue
            
            # Generar imagen aleatoria más relevante
            food_keywords = {
                'Entradas': 'appetizer,starter',
                'Platos Principales': 'main,course,meat',
                'Pastas': 'pasta,italian,spaghetti',
                'Pizzas': 'pizza,italian',
                'Ensaladas': 'salad,fresh,vegetables',
                'Postres': 'dessert,sweet,cake',
                'Bebidas': 'drink,beverage,cocktail'
            }
            
            keywords = food_keywords.get(category, 'food,restaurant')
            image_urls = [
                f"https://source.unsplash.com/400x300/?{keywords}",
                f"https://loremflickr.com/400/300/{keywords.replace(',','/')}"
            ]
            
            # Insertar producto con TODOS los campos correctos
            cursor.execute("""
                INSERT INTO products (
                    name, description, price, category_id, category,
                    image_url, available, preparation_time, cooking_method, 
                    spice_level, calories, protein, carbs, fat,
                    is_vegetarian, is_vegan, is_gluten_free, is_dairy_free, is_nut_free,
                    serving_size, origin_country, company_id, is_signature, is_seasonal,
                    created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                name,                                           # name
                description,                                    # description
                price,                                          # price
                categories[category],                           # category_id
                category,                                       # category
                random.choice(image_urls),                      # image_url
                1,                                              # available
                random.randint(10, 45),                        # preparation_time
                random.choice(cooking_methods),                 # cooking_method
                random.randint(0, 2),                           # spice_level
                random.randint(200, 600),                       # calories
                round(random.uniform(10, 40), 2),              # protein
                round(random.uniform(20, 60), 2),              # carbs
                round(random.uniform(5, 30), 2),               # fat
                1 if random.random() < 0.3 else 0,             # is_vegetarian
                1 if random.random() < 0.1 else 0,             # is_vegan
                1 if random.random() < 0.2 else 0,             # is_gluten_free
                1 if random.random() < 0.1 else 0,             # is_dairy_free
                1 if random.random() < 0.9 else 0,             # is_nut_free
                f"{random.randint(200, 500)}g",                # serving_size
                random.choice(['Italia', 'México', 'Perú', 'España', 'Francia', 'Japón']),  # origin_country
                1,                                              # company_id
                1 if random.random() < 0.2 else 0,             # is_signature
                1 if random.random() < 0.1 else 0              # is_seasonal
            ))
            
            product_id = cursor.lastrowid
            
            # Asignar 3-5 ingredientes aleatorios
            if ingredients:
                num_ingredients = random.randint(3, min(5, len(ingredients)))
                selected_ingredients = random.sample(list(ingredients.keys()), num_ingredients)
                
                for ing_name in selected_ingredients:
                    quantity = random.randint(50, 200)
                    cursor.execute("""
                        INSERT IGNORE INTO product_ingredients 
                        (product_id, ingredient_id, quantity)
                        VALUES (%s, %s, %s)
                    """, (product_id, ingredients[ing_name], quantity))
            
            inserted += 1
            print(f"✓ {inserted}. {name} ({category})")
            
            if inserted % 50 == 0:
                conn.commit()
                print(f"\n💾 Guardados {inserted} productos...\n")
        
        conn.commit()
        
        # Estadísticas finales
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 1")
        total = cursor.fetchone()[0]
        
        print(f"\n🎉 COMPLETADO!")
        print(f"✓ Insertados: {inserted} productos únicos")
        print(f"✓ Total en BD: {total} productos")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n❌ Error de base de datos: {e}")
    except Exception as e:
        print(f"\n❌ Error general: {e}")

if __name__ == "__main__":
    main()