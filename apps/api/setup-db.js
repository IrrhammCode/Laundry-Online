const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Connect to MySQL without specifying database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password' // Change this to your MySQL password
    });

    console.log('✅ Connected to MySQL');

    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS laundry_db');
    console.log('✅ Database "laundry_db" created');

    // Use the database
    await connection.execute('USE laundry_db');
    console.log('✅ Using database "laundry_db"');

    // Create tables
    console.log('📋 Creating tables...');

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Services table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        base_price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        pickup_method ENUM('PICKUP', 'SELF') NOT NULL,
        status ENUM('DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI') NOT NULL DEFAULT 'DIPESAN',
        price_total DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Order items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        service_id INT NOT NULL,
        qty INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `);

    // Payments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        method ENUM('QRIS', 'TRANSFER') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        sender_id INT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        type VARCHAR(100) NOT NULL,
        payload_json JSON,
        sent_at TIMESTAMP NULL,
        channel ENUM('PUSH', 'EMAIL') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);


    console.log('✅ All tables created successfully!');

    // Insert seed data
    console.log('🌱 Inserting seed data...');
    
    const bcrypt = require('bcrypt');
    
    // Insert admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(`
      INSERT IGNORE INTO users (role, name, email, password_hash, phone) 
      VALUES ('ADMIN', 'Admin User', 'admin@laundry.com', ?, '081234567890')
    `, [adminPassword]);

    // Insert demo customer user
    const customerPassword = await bcrypt.hash('demo123', 10);
    await connection.execute(`
      INSERT IGNORE INTO users (role, name, email, password_hash, phone, address) 
      VALUES ('CUSTOMER', 'Demo Customer', 'customer@demo.com', ?, '081234567892', 'Jl. Demo No. 123, Jakarta')
    `, [customerPassword]);

    // Insert services
    await connection.execute(`
      INSERT IGNORE INTO services (name, base_price, unit, description) VALUES
      ('Cuci Reguler', 5000, 'kg', 'Cuci reguler dengan detergen standar'),
      ('Cuci Express', 8000, 'kg', 'Cuci cepat 2 jam selesai'),
      ('Dry Clean Jas', 25000, 'pcs', 'Dry clean untuk jas dan blazer'),
      ('Dry Clean Gaun', 30000, 'pcs', 'Dry clean untuk gaun dan dress'),
      ('Setrika', 3000, 'kg', 'Setrika pakaian'),
      ('Cuci + Setrika', 7000, 'kg', 'Paket cuci dan setrika')
    `);

    console.log('✅ Seed data inserted successfully!');
    console.log('');
    console.log('🎉 Database setup completed!');
    console.log('');
    console.log('👤 Demo accounts created:');
    console.log('- Admin: admin@laundry.com / admin123');
    console.log('- Customer: customer@demo.com / demo123');
    console.log('');
    console.log('🚀 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your MySQL credentials in .env file');
    console.log('3. Make sure MySQL user has permission to create databases');
    console.log('');
    console.log('🔧 To fix MySQL connection:');
    console.log('- Start MySQL service');
    console.log('- Update password in .env file if needed');
    console.log('- Make sure MySQL is accessible on localhost:3306');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();


