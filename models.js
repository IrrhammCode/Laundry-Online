/**
 * Data Models for Laundry Management System
 * 
 * Definisi struct/model lengkap untuk:
 * - User (dengan Role constants)
 * - Order (dengan PickupMethod dan OrderStatus constants)
 * - Service
 */

// ============================================================================
// USER MODEL
// ============================================================================

/**
 * User Role Constants
 */
const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  COURIER: 'COURIER'
};


class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.role = data.role || UserRole.CUSTOMER;
    this.name = data.name || '';
    this.email = data.email || '';
    this.password_hash = data.password_hash || '';
    this.phone = data.phone || null;
    this.address = data.address || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  /**
   * Validate user data
   */
  validate() {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Name is required');
    }
    if (!this.email || this.email.trim() === '') {
      throw new Error('Email is required');
    }
    if (!this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid email format');
    }
    if (!this.password_hash || this.password_hash.trim() === '') {
      throw new Error('Password hash is required');
    }
    if (!Object.values(UserRole).includes(this.role)) {
      throw new Error(`Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`);
    }
    return true;
  }

  /**
   * Convert to plain object (exclude password_hash)
   */
  toJSON() {
    const { password_hash, ...user } = this;
    return user;
  }
}

// ============================================================================
// ORDER MODEL
// ============================================================================

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

/**
 * Order Model Structure
 * 
 * Schema:
 * - id: INT PRIMARY KEY AUTO_INCREMENT
 * - user_id: INT NOT NULL (Foreign Key to users.id)
 * - pickup_method: ENUM('PICKUP', 'SELF') NOT NULL
 * - status: ENUM('DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI') NOT NULL DEFAULT 'DIPESAN'
 * - price_total: DECIMAL(10,2) NOT NULL
 * - notes: TEXT (nullable)
 * - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * - updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * 
 * Related Tables:
 * - order_items: Items dalam order ini
 * - payments: Payment records untuk order ini
 * - messages: Chat messages untuk order ini
 * - courier_updates: Delivery updates dari courier
 */
class Order {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.pickup_method = data.pickup_method || PickupMethod.SELF;
    this.status = data.status || OrderStatus.DIPESAN;
    this.price_total = data.price_total || 0;
    this.notes = data.notes || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Related data (from JOIN queries)
    this.customer_name = data.customer_name || null;
    this.phone = data.phone || null;
    this.address = data.address || null;
    this.email = data.email || null;
    
    // Related collections
    this.items = data.items || [];
    this.payments = data.payments || [];
    this.messages = data.messages || [];
    this.courier_updates = data.courier_updates || [];
  }

  /**
   * Validate order data
   */
  validate() {
    if (!this.user_id || this.user_id <= 0) {
      throw new Error('User ID is required');
    }
    if (!Object.values(PickupMethod).includes(this.pickup_method)) {
      throw new Error(`Invalid pickup method. Must be one of: ${Object.values(PickupMethod).join(', ')}`);
    }
    if (!Object.values(OrderStatus).includes(this.status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(OrderStatus).join(', ')}`);
    }
    if (!this.price_total || this.price_total < 0) {
      throw new Error('Price total must be greater than or equal to 0');
    }
    return true;
  }

  /**
   * Check if order can transition to new status
   */
  canTransitionTo(newStatus) {
    const validTransitions = {
      [OrderStatus.DIPESAN]: [OrderStatus.DIJEMPUT],
      [OrderStatus.DIJEMPUT]: [OrderStatus.DICUCI],
      [OrderStatus.DICUCI]: [OrderStatus.DIKIRIM],
      [OrderStatus.DIKIRIM]: [OrderStatus.SELESAI],
      [OrderStatus.SELESAI]: [] // No transitions from completed
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  /**
   * Get item count
   */
  getItemCount() {
    return this.items.reduce((total, item) => total + item.qty, 0);
  }

  /**
   * Check if order is completed
   */
  isCompleted() {
    return this.status === OrderStatus.SELESAI;
  }
}

/**
 * Order Item Model Structure
 * 
 * Schema:
 * - id: INT PRIMARY KEY AUTO_INCREMENT
 * - order_id: INT NOT NULL (Foreign Key to orders.id)
 * - service_id: INT NOT NULL (Foreign Key to services.id)
 * - qty: INT NOT NULL
 * - unit_price: DECIMAL(10,2) NOT NULL
 * - subtotal: DECIMAL(10,2) NOT NULL
 * - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 */
class OrderItem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.order_id = data.order_id || null;
    this.service_id = data.service_id || null;
    this.qty = data.qty || 0;
    this.unit_price = data.unit_price || 0;
    this.subtotal = data.subtotal || 0;
    this.created_at = data.created_at || null;
    
    // Related data (from JOIN queries)
    this.service_name = data.service_name || null;
    this.unit = data.unit || null;
  }

  /**
   * Calculate subtotal
   */
  calculateSubtotal() {
    this.subtotal = this.qty * this.unit_price;
    return this.subtotal;
  }

  /**
   * Validate order item data
   */
  validate() {
    if (!this.service_id || this.service_id <= 0) {
      throw new Error('Service ID is required');
    }
    if (!this.qty || this.qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (!this.unit_price || this.unit_price < 0) {
      throw new Error('Unit price must be greater than or equal to 0');
    }
    return true;
  }
}

// ============================================================================
// SERVICE MODEL
// ============================================================================

/**
 * Service Model Structure
 * 
 * Schema:
 * - id: INT PRIMARY KEY AUTO_INCREMENT
 * - name: VARCHAR(255) NOT NULL
 * - base_price: DECIMAL(10,2) NOT NULL
 * - unit: VARCHAR(50) NOT NULL
 * - description: TEXT (nullable)
 * - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * - updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 */
class Service {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.base_price = data.base_price || 0;
    this.unit = data.unit || '';
    this.description = data.description || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  /**
   * Validate service data
   */
  validate() {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Service name is required');
    }
    if (!this.base_price || this.base_price < 0) {
      throw new Error('Base price must be greater than or equal to 0');
    }
    if (!this.unit || this.unit.trim() === '') {
      throw new Error('Unit is required');
    }
    return true;
  }

  /**
   * Calculate price for given quantity
   */
  calculatePrice(quantity) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    return this.base_price * quantity;
  }

  /**
   * Format price display
   */
  formatPrice() {
    return `Rp ${this.base_price.toLocaleString('id-ID')}/${this.unit}`;
  }
}

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
    
    // Models
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



