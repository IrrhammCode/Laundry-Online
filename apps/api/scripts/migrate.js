const mysql = require('mysql2/promise');
require('dotenv').config();

const createTables = async () => {
  // Parse database URL or use individual connection parameters
  const getConnectionConfig = () => {
    if (process.env.DATABASE_URL) {
      // Parse DATABASE_URL format: mysql://user:password@host:port/database
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
      };
    }

    // Fallback to individual environment variables
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'laundry_db',
    };
  };

  const connection = await mysql.createConnection(getConnectionConfig());

  try {
    console.log('Creating database tables...');

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role ENUM('CUSTOMER', 'ADMIN', 'COURIER') NOT NULL DEFAULT 'CUSTOMER',
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

    // Messages table (for chat)
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

    // Courier updates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS courier_updates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        courier_id INT NOT NULL,
        delivery_status ENUM('PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED') NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ All tables created successfully!');

    // Insert seed data
    await insertSeedData(connection);

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await connection.end();
  }
};

const insertSeedData = async (connection) => {
  try {
    console.log('Inserting seed data...');

    // Insert admin user
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (role, name, email, password_hash, phone) 
      VALUES ('ADMIN', 'Admin User', 'admin@laundry.com', ?, '081234567890')
    `, [adminPassword]);

    // Insert courier user
    const courierPassword = await bcrypt.hash('courier123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (role, name, email, password_hash, phone) 
      VALUES ('COURIER', 'Courier User', 'courier@laundry.com', ?, '081234567891')
    `, [courierPassword]);

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

  } catch (error) {
    console.error('❌ Error inserting seed data:', error);
  }
};

createTables();
