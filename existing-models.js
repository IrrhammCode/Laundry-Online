/**
 * Data Models - Ekstrak dari Codebase Existing
 * Struktur data yang sebenarnya digunakan di aplikasi Laundry Management System
 * Berdasarkan database schema dan SQL queries yang ada
 */

// ============================================================================
// CONSTANTS (dari ENUM di database)
// ============================================================================

/**
 * User Role Constants
 * Dari: ENUM('CUSTOMER', 'ADMIN', 'COURIER') di tabel users
 */
const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  COURIER: 'COURIER'
};

/**
 * Pickup Method Constants
 * Dari: ENUM('PICKUP', 'SELF') di tabel orders
 */
const PickupMethod = {
  PICKUP: 'PICKUP',  // Pickup service (kurir jemput)
  SELF: 'SELF'       // Self service (customer antar sendiri)
};

/**
 * Order Status Constants
 * Dari: ENUM('DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI') di tabel orders
 */
const OrderStatus = {
  DIPESAN: 'DIPESAN',     // Order placed / Pending
  DIJEMPUT: 'DIJEMPUT',   // Being picked up
  DICUCI: 'DICUCI',       // Being washed
  DIKIRIM: 'DIKIRIM',     // Being delivered
  SELESAI: 'SELESAI'      // Completed
};

// ============================================================================
// USER MODEL
// ============================================================================

/**
 * User Structure
 * 
 * Dari database schema (setup-db.js line 29-40):
 * CREATE TABLE users (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   role ENUM('CUSTOMER', 'ADMIN', 'COURIER') NOT NULL DEFAULT 'CUSTOMER',
 *   name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   password_hash VARCHAR(255) NOT NULL,
 *   phone VARCHAR(20),
 *   address TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * )
 * 
 * Dari SELECT queries di routes/auth.js:
 * - SELECT id, name, email, password_hash, role, phone, address FROM users WHERE email = ?
 * - SELECT id, name, email, role, phone, address FROM users WHERE id = ?
 */
const User = {
  id: null,                    // INT - PRIMARY KEY
  role: UserRole.CUSTOMER,     // ENUM('CUSTOMER', 'ADMIN', 'COURIER')
  name: '',                     // VARCHAR(255) NOT NULL
  email: '',                    // VARCHAR(255) UNIQUE NOT NULL
  password_hash: '',            // VARCHAR(255) NOT NULL (hanya di database)
  phone: null,                  // VARCHAR(20) - nullable
  address: null,                 // TEXT - nullable
  created_at: null,             // TIMESTAMP
  updated_at: null               // TIMESTAMP
};

/**
 * User Response Structure (tanpa password_hash)
 * Dari response di routes/auth.js register/login/me
 */
const UserResponse = {
  id: null,
  name: '',
  email: '',
  role: UserRole.CUSTOMER,
  phone: null,
  address: null
};

// ============================================================================
// ORDER MODEL
// ============================================================================

/**
 * Order Structure
 * 
 * Dari database schema (setup-db.js line 56-68):
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
 * 
 * Dari SELECT queries di routes/orders.js dan routes/admin.js:
 * - SELECT o.id, o.pickup_method, o.status, o.price_total, o.notes, o.created_at,
 *          u.name as customer_name, u.phone, u.address
 *   FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?
 */
const Order = {
  id: null,                          // INT - PRIMARY KEY
  user_id: null,                     // INT NOT NULL (FK to users.id)
  pickup_method: PickupMethod.SELF,  // ENUM('PICKUP', 'SELF')
  status: OrderStatus.DIPESAN,       // ENUM('DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI')
  price_total: 0,                    // DECIMAL(10,2) NOT NULL
  notes: null,                       // TEXT - nullable
  created_at: null,                  // TIMESTAMP
  updated_at: null,                  // TIMESTAMP
  
  // Related data dari JOIN queries
  customer_name: null,               // Dari users.name via JOIN
  phone: null,                       // Dari users.phone via JOIN
  address: null,                     // Dari users.address via JOIN
  email: null                        // Dari users.email via JOIN (admin only)
};

/**
 * Order Item Structure (related to Order)
 * 
 * Dari database schema (setup-db.js line 71-83):
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
 * 
 * Dari SELECT queries di routes/orders.js:
 * - SELECT oi.id, oi.qty, oi.unit_price, oi.subtotal,
 *          s.name as service_name, s.unit
 *   FROM order_items oi JOIN services s ON oi.service_id = s.id WHERE oi.order_id = ?
 */
const OrderItem = {
  id: null,           // INT - PRIMARY KEY
  order_id: null,     // INT NOT NULL (FK to orders.id)
  service_id: null,   // INT NOT NULL (FK to services.id)
  qty: 0,             // INT NOT NULL
  unit_price: 0,      // DECIMAL(10,2) NOT NULL
  subtotal: 0,        // DECIMAL(10,2) NOT NULL
  created_at: null,   // TIMESTAMP
  
  // Related data dari JOIN queries
  service_name: null, // Dari services.name via JOIN
  unit: null          // Dari services.unit via JOIN
};

/**
 * Order Detail Response (dari routes/orders.js dan routes/admin.js)
 * Menggabungkan Order + OrderItems + Payments + CourierUpdates + Messages
 */
const OrderDetail = {
  // Order fields
  id: null,
  pickup_method: PickupMethod.SELF,
  status: OrderStatus.DIPESAN,
  price_total: 0,
  notes: null,
  created_at: null,
  updated_at: null,
  
  // Customer info dari JOIN
  customer_name: null,
  phone: null,
  address: null,
  email: null,  // Hanya di admin endpoint
  
  // Related collections
  items: [],              // Array of OrderItem
  payments: [],           // Array of Payment
  courier_updates: [],    // Array of CourierUpdate
  messages: []            // Array of Message (admin only)
};

/**
 * Order List Item (untuk pagination)
 * Dari routes/orders.js GET /me
 */
const OrderListItem = {
  id: null,
  pickup_method: PickupMethod.SELF,
  status: OrderStatus.DIPESAN,
  price_total: 0,
  created_at: null,
  item_count: 0  // COUNT dari order_items
};

// ============================================================================
// SERVICE MODEL
// ============================================================================

/**
 * Service Structure
 * 
 * Dari database schema (setup-db.js line 43-53):
 * CREATE TABLE services (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(255) NOT NULL,
 *   base_price DECIMAL(10,2) NOT NULL,
 *   unit VARCHAR(50) NOT NULL,
 *   description TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * )
 * 
 * Dari SELECT query di routes/orders.js:
 * - SELECT id, name, base_price, unit, description FROM services ORDER BY name
 * 
 * Dari SELECT query di routes/orders.js createOrder:
 * - SELECT id, name, base_price FROM services WHERE id = ?
 */
const Service = {
  id: null,           // INT - PRIMARY KEY
  name: '',           // VARCHAR(255) NOT NULL
  base_price: 0,      // DECIMAL(10,2) NOT NULL
  unit: '',           // VARCHAR(50) NOT NULL
  description: null,   // TEXT - nullable
  created_at: null,   // TIMESTAMP
  updated_at: null    // TIMESTAMP
};

// ============================================================================
// RELATED MODELS (untuk kelengkapan)
// ============================================================================

/**
 * Payment Structure (related to Order)
 * 
 * Dari database schema (setup-db.js line 86-97):
 * CREATE TABLE payments (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   order_id INT NOT NULL,
 *   method ENUM('QRIS', 'TRANSFER') NOT NULL,
 *   amount DECIMAL(10,2) NOT NULL,
 *   status ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
 *   paid_at TIMESTAMP NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
 * )
 */
const Payment = {
  id: null,
  order_id: null,
  method: 'QRIS',  // ENUM('QRIS', 'TRANSFER')
  amount: 0,
  status: 'PENDING',  // ENUM('PENDING', 'PAID', 'FAILED')
  paid_at: null,
  created_at: null
};

/**
 * Courier Update Structure (related to Order)
 * 
 * Dari database schema (setup-db.js line 129-140):
 * CREATE TABLE courier_updates (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   order_id INT NOT NULL,
 *   courier_id INT NOT NULL,
 *   delivery_status ENUM('PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED') NOT NULL,
 *   notes TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
 *   FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE CASCADE
 * )
 */
const CourierUpdate = {
  id: null,
  order_id: null,
  courier_id: null,
  delivery_status: 'PICKED_UP',  // ENUM('PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED')
  notes: null,
  created_at: null,
  courier_name: null  // Dari JOIN dengan users
};

/**
 * Message Structure (related to Order)
 * 
 * Dari database schema (setup-db.js line 100-110):
 * CREATE TABLE messages (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   order_id INT NOT NULL,
 *   sender_id INT NOT NULL,
 *   body TEXT NOT NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
 *   FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
 * )
 */
const Message = {
  id: null,
  order_id: null,
  sender_id: null,
  body: '',
  created_at: null,
  sender_name: null,   // Dari JOIN dengan users
  sender_role: null    // Dari JOIN dengan users
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
    
    // Main Models
    User,
    UserResponse,
    Order,
    OrderItem,
    OrderDetail,
    OrderListItem,
    Service,
    
    // Related Models
    Payment,
    CourierUpdate,
    Message
  };
}

// For ES6 Modules
if (typeof window !== 'undefined') {
  window.UserRole = UserRole;
  window.PickupMethod = PickupMethod;
  window.OrderStatus = OrderStatus;
  window.User = User;
  window.UserResponse = UserResponse;
  window.Order = Order;
  window.OrderItem = OrderItem;
  window.OrderDetail = OrderDetail;
  window.OrderListItem = OrderListItem;
  window.Service = Service;
  window.Payment = Payment;
  window.CourierUpdate = CourierUpdate;
  window.Message = Message;
}


