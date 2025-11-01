# Laundry-Online

# Laundry & Dry Clean Management System

A comprehensive web application for managing laundry and dry cleaning services with customer, admin, and courier interfaces.

## Features

### Customer Features
- **User Registration & Authentication** - Secure user registration and login
- **Order Management** - Create, track, and manage laundry orders
- **Real-time Chat** - Chat with courier and admin support
- **Order History** - View past orders and their status
- **Profile Management** - Update personal information
- **Payment Integration** - QRIS and bank transfer payment options

### Admin Features
- **Dashboard** - Overview of business statistics and recent orders
- **Order Management** - View and update order statuses
- **Service Management** - Add, edit, and delete laundry services
- **Customer Support** - Chat with customers about their orders
- **Analytics** - Revenue and order statistics

### Courier Features
- **Delivery Management** - Track pickup and delivery status
- **Order Updates** - Update delivery status and add notes
- **Customer Communication** - Chat with customers about deliveries

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database with mysql2
- **Socket.IO** for real-time chat
- **JWT** for authentication
- **bcrypt** for password hashing
- **nodemailer** for email notifications

### Frontend
- **Vanilla HTML, CSS, JavaScript** (ES6 modules)
- **Responsive design** with mobile support
- **Real-time updates** with Socket.IO client

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd laundry-dry-clean
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install API dependencies
cd apps/api
npm install

# Install web dependencies
cd ../web
npm install
```

### 3. Database Setup
1. Create a MySQL database named `laundry_db`
2. Update the database connection in `env.example` and rename it to `.env`
3. Run the database migration:
```bash
cd apps/api
npm run migrate
```

### 4. Environment Configuration
Create a `.env` file in the `apps/api` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=mysql://root:password@localhost:3306/laundry_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Laundry System <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 5. Run the Application

#### Development Mode (Both API and Web)
```bash
# From the root directory
npm run dev
```

#### Run Separately
```bash
# API Server (Terminal 1)
cd apps/api
npm run dev

# Web Server (Terminal 2)
cd apps/web
npm run dev
```

### 6. Access the Application

#### Quick Start (No Database Required)
```bash
# Run the mock version (no database setup needed)
.\start-mock.bat
```

#### With Database
```bash
# Setup database first, then run
npm run dev
```

**Access URLs:**
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Demo Login**: http://localhost:3000/demo-login.html
- **Admin Login**: http://localhost:3000/admin/login.html

## Demo Accounts

After running the migration, you'll have these demo accounts for testing:

### Customer Demo
- **Email**: customer@demo.com
- **Password**: demo123
- **Features**: Create orders, view history, chat support

### Admin Account
- **Email**: admin@laundry.com
- **Password**: admin123
- **Features**: Manage orders, update status, service management

### Courier Account
- **Email**: courier@laundry.com
- **Password**: courier123
- **Features**: Pickup/delivery management, status updates

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/forgot` - Forgot password
- `POST /api/auth/reset` - Reset password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Orders
- `GET /api/orders/services` - Get available services
- `POST /api/orders` - Create new order
- `GET /api/orders/me` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:orderId/payment/confirm` - Confirm payment

### Admin
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/services` - Get services
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### Courier
- `GET /api/courier/orders` - Get courier orders
- `GET /api/courier/orders/:id` - Get order details
- `POST /api/courier/orders/:id/pickup` - Mark as picked up
- `POST /api/courier/orders/:id/deliver` - Mark as delivered
- `POST /api/courier/orders/:id/delivery-status` - Update delivery status

### Chat & Notifications
- `GET /api/chat/orders/:orderId/messages` - Get chat messages
- `POST /api/chat/orders/:orderId/messages` - Send message
- `GET /api/chat/notifications` - Get notifications
- `PATCH /api/chat/notifications/:id/read` - Mark notification as read

## Project Structure

```
laundry-dry-clean/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── config/          # Database configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Database migration scripts
│   │   └── server.js        # Main server file
│   └── web/                 # Frontend
│       ├── css/            # Stylesheets
│       ├── js/             # JavaScript modules
│       │   ├── services/   # API service classes
│       │   ├── utils/      # Utility functions
│       │   └── admin/      # Admin-specific scripts
│       └── *.html          # HTML pages
├── package.json            # Root package.json
└── README.md              # This file
```

## Database Schema

### Tables
- **users** - User accounts (customers, admins, couriers)
- **services** - Available laundry services
- **orders** - Customer orders
- **order_items** - Items within each order
- **payments** - Payment records
- **messages** - Chat messages
- **notifications** - System notifications
- **courier_updates** - Delivery status updates

## Features Implementation

### Functional Requirements (FR)
- ✅ **FR-01**: User Registration
- ✅ **FR-02**: User Login
- ✅ **FR-03**: Order Creation
- ✅ **FR-04**: Order History
- ✅ **FR-05**: Admin Login
- ✅ **FR-06**: Admin Order Management
- ✅ **FR-07**: Order Details
- ✅ **FR-08**: Password Reset
- ✅ **FR-09**: Payment Confirmation
- ✅ **FR-10**: Status Notifications
- ✅ **FR-11**: Real-time Chat
- ✅ **FR-12**: Status Updates
- ✅ **FR-13**: Profile Management
- ✅ **FR-14**: Service Management
- ✅ **FR-15**: Price Calculation
- ✅ **FR-16**: Payment Methods

## Development

### Adding New Features
1. Create API routes in `apps/api/routes/`
2. Add frontend pages in `apps/web/`
3. Update database schema if needed
4. Test with the provided endpoints

### Database Migrations
```bash
cd apps/api
node scripts/migrate.js
```

### Testing API Endpoints
Use the provided Postman collection or test with curl:

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test user registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use a production database
3. Configure proper SMTP settings
4. Set secure JWT secrets
5. Use a reverse proxy (nginx)
6. Enable HTTPS

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-production-secret
SMTP_HOST=your-smtp-host
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
