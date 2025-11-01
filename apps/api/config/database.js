const mysql = require('mysql2/promise');
require('dotenv').config();

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
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'laundry_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
};

// Create connection pool
const pool = mysql.createPool(getConnectionConfig());

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize connection test
testConnection();

module.exports = pool;



