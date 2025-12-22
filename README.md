# Laundry-Online

# Laundry & Dry Clean Management System

A comprehensive web application for managing laundry and dry cleaning services with customer and admin interfaces.

## Features

### Customer Features
- **User Registration & Authentication** - Secure user registration and login
- **Order Management** - Create, track, and manage laundry orders
- **Real-time Chat** - Chat with admin support
- **Order History** - View past orders and their status
- **Profile Management** - Update personal information
- **Payment Integration** - QRIS (mock) and bank transfer payment options
- **Delivery Method Selection** - Choose self-pickup or delivery
- **Custom Email Notifications** - Use registered email or custom email for notifications
- **Order Reviews** - Submit reviews for completed orders

### Admin Features
- **Dashboard** - Overview of business statistics and recent orders
- **Order Management** - View and update order statuses, approve pickup orders
- **Service Management** - Add, edit, and delete laundry services
- **Customer Support** - Chat with customers about their orders
- **Analytics** - Revenue and order statistics with charts
- **Notifications** - Receive notifications for new orders and updates
- **Review Management** - View customer reviews for orders

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** (PostgreSQL) database
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
- Supabase account (free tier available)
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

### 3. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com)
2. Get your Supabase URL and Service Role Key from Project Settings > API
3. Run the SQL schema in Supabase SQL Editor:
   - Copy the contents of `apps/api/scripts/supabase-schema.sql`
   - Paste and run in Supabase SQL Editor
4. Or use the migration script:
```bash
cd apps/api
node scripts/run-migration.js
```

### 4. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

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

**Access URLs:**
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
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

**Note**: Courier role has been removed. All delivery operations are handled by admin.

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
- `GET /api/orders/services` - Get available services (public)
- `GET /api/orders/recommendations` - Get recommended packages
- `POST /api/orders` - Create new order
- `GET /api/orders/me` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/choose-delivery` - Choose delivery method (SELF_PICKUP or DELIVERY)
- `POST /api/orders/:id/pay-qris` - Mock QRIS payment
- `POST /api/orders/:orderId/payment/confirm` - Confirm payment

### Admin
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status
- `PATCH /api/admin/orders/:id/approve` - Approve pickup order
- `PATCH /api/admin/orders/:id/confirm-delivery` - Confirm delivery (after washing)
- `GET /api/admin/services` - Get services
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/notifications` - Get admin notifications
- `GET /api/admin/reviews` - Get all reviews

### Chat & Notifications
- `GET /api/chat/orders/:orderId/messages` - Get chat messages
- `POST /api/chat/orders/:orderId/messages` - Send message
- `GET /api/chat/notifications` - Get user notifications
- `PATCH /api/chat/notifications/:id/read` - Mark notification as read

### Reviews
- `POST /api/reviews` - Submit review for completed order
- `GET /api/reviews/order/:orderId` - Get review for specific order

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
- **users** - User accounts (customers, admins)
- **services** - Available laundry services
- **orders** - Customer orders (with status flow: DIPESAN → PESANAN_DIJEMPUT → DIAMBIL → DICUCI → MENUNGGU_KONFIRMASI_DELIVERY → MENUNGGU_PEMBAYARAN_DELIVERY → MENUNGGU_AMBIL_SENDIRI → DIKIRIM → SELESAI)
- **order_items** - Items within each order
- **payments** - Payment records
- **messages** - Chat messages
- **notifications** - System notifications
- **reviews** - Customer reviews for orders
- **complaints** - Customer complaints

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
node scripts/run-migration.js
```

**Note**: Migration scripts are in `apps/api/scripts/` but are excluded from git. For setup, use Supabase SQL Editor or the migration script.

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

### Deploy to Vercel

This project is configured for deployment on Vercel with Supabase as the database.

#### 1. Deploy Backend API

1. **Create a new Vercel project for the API:**
   ```bash
   cd apps/api
   vercel
   ```

2. **Set Environment Variables in Vercel Dashboard:**
   - Go to your Vercel project settings > Environment Variables
   - Add the following variables:
   ```env
   NODE_ENV=production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-production-secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Laundry System <your-email@gmail.com>
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Note the API URL:** After deployment, Vercel will provide a URL like `https://your-api-project.vercel.app`

#### 2. Deploy Frontend

1. **Create a new Vercel project for the Frontend:**
   ```bash
   cd apps/web
   vercel
   ```

2. **Set Environment Variables in Vercel Dashboard:**
   ```env
   VITE_API_URL=https://your-api-project.vercel.app/api
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

#### 3. Update CORS Configuration

Make sure your backend API allows requests from your frontend domain. The backend is already configured to accept requests from any `*.vercel.app` domain, but you can also set `FRONTEND_URL` to your specific frontend URL.

#### 4. Verify Deployment

- Frontend: `https://your-frontend-project.vercel.app`
- API: `https://your-api-project.vercel.app/api`
- Admin: `https://your-frontend-project.vercel.app/admin/login.html`

### Important Notes

- **Backend and Frontend are separate Vercel projects** - Deploy them separately
- **Environment Variables** - Make sure `VITE_API_URL` in frontend points to your backend API URL
- **CORS** - Backend automatically allows `*.vercel.app` domains
- **Build Script** - The `vercel-build.js` script will automatically inject `VITE_API_URL` into HTML files during build

### Alternative: Single Vercel Project

If you want to deploy both frontend and backend in a single Vercel project, you'll need to configure `vercel.json` at the root to route `/api/*` to the backend and everything else to the frontend.

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
