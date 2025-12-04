const mysql = require('mysql2/promise');
require('dotenv').config();

const seedServices = async () => {
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
    console.log('Seeding services...');
    
    // Check if services already exist
    const [existingServices] = await connection.execute('SELECT COUNT(*) as count FROM services');
    
    if (existingServices[0].count > 0) {
      console.log('Services already exist, skipping...');
      return;
    }

    // Insert sample services
    const services = [
      {
        name: 'Regular Wash',
        base_price: 15000,
        unit: 'kg',
        description: 'Standard washing service for everyday clothes'
      },
      {
        name: 'Dry Clean',
        base_price: 25000,
        unit: 'piece',
        description: 'Professional dry cleaning for delicate fabrics'
      },
      {
        name: 'Express Wash',
        base_price: 20000,
        unit: 'kg',
        description: 'Fast washing service (same day)'
      },
      {
        name: 'Ironing Only',
        base_price: 5000,
        unit: 'piece',
        description: 'Ironing service only'
      }
    ];

    for (const service of services) {
      await connection.execute(
        'INSERT INTO services (name, base_price, unit, description) VALUES (?, ?, ?, ?)',
        [service.name, service.base_price, service.unit, service.description]
      );
      console.log(`Added service: ${service.name}`);
    }

    console.log('Services seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding services:', error);
  } finally {
    connection.end();
  }
};

seedServices();










