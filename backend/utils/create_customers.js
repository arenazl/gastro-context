#!/usr/bin/env node
/**
 * Crear tabla de clientes para el sistema
 */

const mysql = require('mysql2/promise');

async function createCustomersTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'mysql-aiven-arenazl.e.aivencloud.com',
      port: 23108,
      user: 'avnadmin',
      password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
      database: 'gastro'
    });
    
    console.log('🔗 Conectado a MySQL');
    
    // 1. Crear tabla de clientes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        preferences TEXT,
        loyalty_points INT DEFAULT 0,
        total_visits INT DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_name (first_name, last_name),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla customers creada');
    
    // 2. Actualizar tabla orders para incluir customer_id
    try {
      await connection.execute('ALTER TABLE orders ADD COLUMN customer_id INT');
      await connection.execute('ALTER TABLE orders ADD FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL');
      await connection.execute('ALTER TABLE orders ADD INDEX idx_customer_id (customer_id)');
      console.log('✅ Campo customer_id agregado a orders');
    } catch (error) {
      console.log('⚠️ Campo customer_id ya existe en orders');
    }
    
    // 3. Insertar clientes de ejemplo
    const sampleCustomers = [
      ['Juan', 'Pérez', 'juan.perez@email.com', '+54 11 1234-5678', 'Av. Corrientes 1234, CABA', '1985-03-15', 'Sin gluten', 150, 12, 890.50, 'Cliente frecuente, prefiere mesa cerca de la ventana'],
      ['María', 'González', 'maria.gonzalez@email.com', '+54 11 2345-6789', 'Av. Santa Fe 5678, CABA', '1990-07-22', 'Vegetariana', 89, 8, 456.75, 'Siempre pide agua sin gas'],
      ['Carlos', 'Rodríguez', 'carlos.rodriguez@email.com', '+54 11 3456-7890', 'Av. Cabildo 9012, CABA', '1978-12-03', 'Le gustan los vinos tintos', 245, 18, 1250.30, 'Celebra aniversario el 15 de junio'],
      ['Ana', 'Martínez', 'ana.martinez@email.com', '+54 11 4567-8901', 'Av. Rivadavia 3456, CABA', '1992-05-18', 'Intolerante a la lactosa', 67, 5, 298.90, 'Nueva cliente, muy amable'],
      ['Roberto', 'Silva', 'roberto.silva@email.com', '+54 11 5678-9012', 'Av. Las Heras 7890, CABA', '1980-11-30', 'Parrilla y carnes rojas', 312, 25, 1845.60, 'VIP - Cliente desde la apertura'],
      ['Laura', 'López', 'laura.lopez@email.com', '+54 11 6789-0123', 'Av. Pueyrredón 2345, CABA', '1987-09-08', 'Postres sin azúcar', 98, 9, 567.40, 'Viene siempre los viernes'],
      ['Diego', 'Fernández', 'diego.fernandez@email.com', '+54 11 7890-1234', 'Av. Callao 6789, CABA', '1975-04-25', 'Pescados y mariscos', 189, 14, 987.20, 'Alérgico a los frutos secos'],
      ['Sofía', 'Torres', 'sofia.torres@email.com', '+54 11 8901-2345', 'Av. 9 de Julio 4567, CABA', '1995-01-12', 'Comida asiática', 45, 4, 234.80, 'Cliente joven, siempre con amigos'],
      ['Miguel', 'Ruiz', 'miguel.ruiz@email.com', '+54 11 9012-3456', 'Av. Belgrano 8901, CABA', '1983-08-17', 'Vinos y quesos', 167, 11, 723.15, 'Sommelier amateur'],
      ['Valeria', 'Morales', 'valeria.morales@email.com', '+54 11 0123-4567', 'Av. Libertador 1234, CABA', '1989-06-29', 'Opciones veganas', 78, 6, 345.60, 'Influencer gastronómica']
    ];
    
    for (const [firstName, lastName, email, phone, address, dateOfBirth, preferences, loyaltyPoints, totalVisits, totalSpent, notes] of sampleCustomers) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO customers (first_name, last_name, email, phone, address, date_of_birth, preferences, loyalty_points, total_visits, total_spent, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [firstName, lastName, email, phone, address, dateOfBirth, preferences, loyaltyPoints, totalVisits, totalSpent, notes]
        );
      } catch (error) {
        console.log(`⚠️ Cliente ${firstName} ${lastName} ya existe`);
      }
    }
    console.log('✅ Clientes de ejemplo insertados');
    
    // 4. Verificar resultados
    const [customerCount] = await connection.execute('SELECT COUNT(*) as count FROM customers');
    
    console.log(`\n📊 Resultados:`);
    console.log(`   - ${customerCount[0].count} clientes en la base de datos`);
    
    // Mostrar algunos clientes
    const [customersList] = await connection.execute('SELECT first_name, last_name, email, loyalty_points FROM customers ORDER BY loyalty_points DESC LIMIT 5');
    console.log(`\n👥 Clientes top (por puntos de lealtad):`);
    customersList.forEach(customer => {
      console.log(`   - ${customer.first_name} ${customer.last_name} (${customer.email}) - ${customer.loyalty_points} pts`);
    });
    
    await connection.end();
    console.log('\n✨ Setup de clientes completado!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCustomersTable();