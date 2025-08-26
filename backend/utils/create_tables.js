#!/usr/bin/env node
/**
 * Create database tables using Node.js mysql2 package
 */

const fs = require('fs');
const https = require('https');

// First, let's install mysql2 and then create tables
console.log('🚀 Restaurant Management System - Database Setup');
console.log('=' * 50);

// Create a package.json for this script
const packageJson = {
  "name": "database-setup",
  "version": "1.0.0",
  "dependencies": {
    "mysql2": "^3.6.5"
  }
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('📦 Created package.json');

// Install dependencies
const { execSync } = require('child_process');

try {
  console.log('📥 Installing mysql2...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Now create the tables
  const mysql = require('mysql2/promise');
  
  async function createTables() {
    const connection = await mysql.createConnection({
      host: 'mysql-aiven-arenazl.e.aivencloud.com',
      port: 23108,
      user: 'avnadmin',
      password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
      database: 'gastro'
    });
    
    console.log('✅ Connected to MySQL database!');
    
    // Read and execute SQL file
    const sqlContent = fs.readFileSync('create_tables.sql', 'utf8');
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          await connection.execute(statement);
          
          // Log what we're doing
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE (\w+)/i)?.[1] || 'unknown';
            console.log(`✅ Created table: ${tableName}`);
          } else if (statement.includes('INSERT INTO')) {
            const tableName = statement.match(/INSERT INTO (\w+)/i)?.[1] || 'unknown';
            console.log(`📝 Inserted data into: ${tableName}`);
          } else if (statement.includes('DROP TABLE')) {
            const tableName = statement.match(/DROP TABLE (?:IF EXISTS )?(\w+)/i)?.[1] || 'unknown';
            console.log(`🗑️ Dropped table: ${tableName}`);
          }
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes("doesn't exist")) {
            console.log(`⚠️ Ignoring: ${error.message}`);
          } else {
            console.error(`❌ Error executing statement: ${error.message}`);
          }
        }
      }
    }
    
    // Verify tables were created
    const [rows] = await connection.execute('SHOW TABLES');
    console.log(`\n📋 Tables in database (${rows.length} total):`);
    for (const row of rows) {
      console.log(`   - ${Object.values(row)[0]}`);
    }
    
    // Check data counts
    try {
      const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
      const [productRows] = await connection.execute('SELECT COUNT(*) as count FROM products');
      const [tableRows] = await connection.execute('SELECT COUNT(*) as count FROM tables');
      
      console.log(`\n📊 Data summary:`);
      console.log(`   - ${userRows[0].count} users`);
      console.log(`   - ${productRows[0].count} products`);
      console.log(`   - ${tableRows[0].count} tables`);
    } catch (e) {
      console.log('⚠️ Could not get data counts (tables might be empty)');
    }
    
    await connection.end();
    console.log('\n✨ Database setup complete!');
  }
  
  createTables().catch(console.error);
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
}