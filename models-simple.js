/**
 * Data Models - Simple Struct Definitions
 * Definisi struct/model data untuk Laundry Management System
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * User Role Constants
 */
const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN'
};

/**
 * Pickup Method Constants
 */
const PickupMethod = {
  PICKUP: 'PICKUP',  // Pickup service (kurir jemput)
  SELF: 'SELF'       // Self service (customer antar sendiri)
};

/**
 * Order Status Constants
 */
const OrderStatus = {
  DIPESAN: 'DIPESAN',     // Order placed / Pending
  DIJEMPUT: 'DIJEMPUT',   // Being picked up
  DICUCI: 'DICUCI',       // Being washed
  DIKIRIM: 'DIKIRIM',     // Being delivered
  SELESAI: 'SELESAI'      // Completed
};

// ============================================================================
// USER STRUCT
// ============================================================================

/**
 * User Model Structure
 * 
 * Database Schema:
 * CREATE TABLE users (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
 *   name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   password_hash VARCHAR(255) NOT NULL,
 *   phone VARCHAR(20),
 *   address TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * )
 */
const User = {
  id: null,                    // INT PRIMARY KEY AUTO_INCREMENT
  role: UserRole.CUSTOMER,     // ENUM('CUSTOMER', 'ADMIN')
  name: '',                     // VARCHAR(255) NOT NULL
  email: '',                    // VARCHAR(255) UNIQUE NOT NULL
  password_hash: '',            // VARCHAR(255) NOT NULL
  phone: null,                  // VARCHAR(20) nullable
  address: null,                // TEXT nullable
  created_at: null,             // TIMESTAMP
  updated_at: null              // TIMESTAMP
};

// ============================================================================
// ORDER STRUCT
// ============================================================================

/**
 * Order Model Structure
 * 
 * Database Schema:
 * CREATE TABLE orders (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   user_id INT NOT NULL,
 *   pickup_method ENUM('PICKUP', 'SELF') NOT NULL,
 *   status ENUM('DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI') NOT NULL DEFAULT 'DIPESAN',
 *   price_total DECIMAL(10,2) NOT NULL,
 *   notes TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * )
 */
const Order = {
  id: null,                          // INT PRIMARY KEY AUTO_INCREMENT
  user_id: null,                     // INT NOT NULL (FK to users.id)
  pickup_method: PickupMethod.SELF,  // ENUM('PICKUP', 'SELF')
  status: OrderStatus.DIPESAN,       // ENUM('DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI')
  price_total: 0,                    // DECIMAL(10,2) NOT NULL
  notes: null,                       // TEXT nullable
  created_at: null,                  // TIMESTAMP
  updated_at: null,                  // TIMESTAMP
  
  // Related data (from JOIN queries)
  customer_name: null,               // From users table
  phone: null,                       // From users table
  address: null,                     // From users table
  email: null                        // From users table
};

/**
 * Order Item Structure (related to Order)
 * 
 * Database Schema:
 * CREATE TABLE order_items (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   order_id INT NOT NULL,
 *   service_id INT NOT NULL,
 *   qty INT NOT NULL,
 *   unit_price DECIMAL(10,2) NOT NULL,
 *   subtotal DECIMAL(10,2) NOT NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
 *   FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
 * )
 */
const OrderItem = {
  id: null,           // INT PRIMARY KEY AUTO_INCREMENT
  order_id: null,      // INT NOT NULL (FK to orders.id)
  service_id: null,    // INT NOT NULL (FK to services.id)
  qty: 0,             // INT NOT NULL
  unit_price: 0,      // DECIMAL(10,2) NOT NULL
  subtotal: 0,        // DECIMAL(10,2) NOT NULL
  created_at: null,   // TIMESTAMP
  
  // Related data (from JOIN queries)
  service_name: null, // From services table
  unit: null          // From services table
};

// ============================================================================
// SERVICE STRUCT
// ============================================================================

/**
 * Service Model Structure
 * 
 * Database Schema:
 * CREATE TABLE services (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(255) NOT NULL,
 *   base_price DECIMAL(10,2) NOT NULL,
 *   unit VARCHAR(50) NOT NULL,
 *   description TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * )
 */
const Service = {
  id: null,           // INT PRIMARY KEY AUTO_INCREMENT
  name: '',           // VARCHAR(255) NOT NULL
  base_price: 0,      // DECIMAL(10,2) NOT NULL
  unit: '',           // VARCHAR(50) NOT NULL
  description: null,   // TEXT nullable
  created_at: null,    // TIMESTAMP
  updated_at: null     // TIMESTAMP
};

// ============================================================================
// EXPORTS
// ============================================================================

// For Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    UserRole,
    PickupMethod,
    OrderStatus,
    
    // Struct Definitions
    User,
    Order,
    OrderItem,
    Service
  };
}

// For ES6 Modules
if (typeof window !== 'undefined') {
  window.UserRole = UserRole;
  window.PickupMethod = PickupMethod;
  window.OrderStatus = OrderStatus;
  window.User = User;
  window.Order = Order;
  window.OrderItem = OrderItem;
  window.Service = Service;
}






