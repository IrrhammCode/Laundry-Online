# Class Diagram MVC Pattern - Laundry Management System

Dokumentasi class diagram dengan **MVC (Model-View-Controller)** pattern untuk semua module.

---

## 📐 Arsitektur MVC Pattern

```
┌──────────────┐
│   Model      │  ← Data access & business logic
│   (Service)  │
└──────┬───────┘
       │
       │ used by
       │
┌──────▼───────┐
│  Controller  │  ← Business logic & coordination
│  (Controller)│
└──────┬───────┘
       │
       │ updates
       │
┌──────▼───────┐
│    View      │  ← UI rendering & DOM manipulation
│  (View Class)│
└──────┬───────┘
       │
       │ manipulates
       │
┌──────▼───────┐
│     HTML     │  ← Template structure
│   Template   │
└──────────────┘
```

---

## 🔷 1. ORDER MODULE (MVC)

### MVC Structure

```
┌─────────────────────────────────────────┐
│         OrderController                 │
├─────────────────────────────────────────┤
│ - orderService: OrderService            │
│ - view: OrderView                      │
│ - services: Array                       │
│ - selectedItems: Array                  │
│ - pickupFee: number                     │
│ - currentOrderId: number                │
├─────────────────────────────────────────┤
│ + init(): Promise<void>                 │
│ + addService(serviceId): void           │
│ + removeService(serviceId): void        │
│ + updateServiceQuantity(id, qty): void  │
│ + handleOrderSubmit(e): Promise<void>  │
│ + handlePaymentSubmit(e): Promise<void> │
│ + updateView(): void                    │
│ - checkAuth(): Promise<void>            │
│ - loadServices(): Promise<void>         │
└──────────────┬──────────────────────────┘
               │ uses
               ├────────────────────┐
               │                    │
┌──────────────▼──────────┐  ┌──────▼──────────────┐
│       OrderView         │  │   OrderService      │
├─────────────────────────┤  │    (Model)          │
│ - servicesGrid: Element │  ├────────────────────┤
│ - orderItems: Element   │  │ + getServices()    │
│ - servicesTotal: Element│  │ + createOrder()    │
│ - pickupFee: Element    │  │ + confirmPayment() │
│ - orderTotal: Element   │  │ + getUserOrders()  │
├─────────────────────────┤  │ + getOrderDetail() │
│ + renderServices(s): void│ └────────────────────┘
│ + renderOrderItems(i): void
│ + updateOrderSummary(t): void
│ + showPaymentModal(o): void
│ + showAlert(m, t): void
│ + showLoading(): void
│ + hideLoading(): void
│ + getPickupMethod(): string
│ + getFormData(): Object
└─────────────────────────┘
```

### **OrderController** (apps/web/js/controllers/OrderController.js)
```javascript
class OrderController {
    constructor() {
        this.orderService = new OrderService();  // Model
        this.view = new OrderView();             // View
    }
    
    // Business Logic Only
    addService(serviceId) { }
    removeService(serviceId) { }
    handleOrderSubmit(e) { }
    handlePaymentSubmit(e) { }
    updateView() { }  // Coordinates View updates
}
```

### **OrderView** (apps/web/js/views/OrderView.js)
```javascript
class OrderView {
    constructor() {
        // Cache DOM elements
        this.servicesGrid = document.getElementById('servicesGrid');
    }
    
    // DOM Manipulation Only
    renderServices(services) { }
    renderOrderItems(items) { }
    updateOrderSummary(total) { }
    showPaymentModal(order) { }
    getPickupMethod() { }  // Get user input
    getFormData() { }      // Get form data
}
```

### **OrderService** (apps/web/js/services/order.js) - Model
```javascript
class OrderService {
    // Data Access Only
    async getServices() { }
    async createOrder(orderData) { }
    async confirmPayment(orderId, paymentData) { }
}
```

---

## 🔷 2. HISTORY MODULE (MVC)

### MVC Structure

```
┌─────────────────────────────────────────┐
│        HistoryController                 │
├─────────────────────────────────────────┤
│ - orderService: OrderService            │
│ - chatService: ChatService              │
│ - view: HistoryView                     │
│ - currentPage: number                   │
│ - currentStatus: string                 │
│ - currentOrderId: number                │
├─────────────────────────────────────────┤
│ + init(): Promise<void>                 │
│ + loadOrders(page, status): Promise<void>│
│ + loadOrderDetail(id): Promise<void>   │
│ + openChat(orderId): Promise<void>     │
│ + sendMessage(): Promise<void>          │
│ - checkAuth(): Promise<void>            │
│ - loadChatMessages(id): Promise<void>  │
└──────────────┬──────────────────────────┘
               │
               ├────────────────────┐
               │                    │
┌──────────────▼──────────┐  ┌──────▼──────────────┐
│       HistoryView        │  │   Services          │
├─────────────────────────┤  │    (Models)         │
│ - ordersList: Element   │  └────────────────────┘
│ - pagination: Element   │
│ - orderDetailModal: Modal
├─────────────────────────┤
│ + renderOrders(o): void │
│ + renderPagination(p): void
│ + renderOrderDetail(o): void
│ + renderChat(m): void  │
│ + showOrderModal(id): void
│ + showChatModal(id): void
│ + getStatusFilter(): string
│ + getChatInput(): string
└─────────────────────────┘
```

### **HistoryController** (apps/web/js/controllers/HistoryController.js)
```javascript
class HistoryController {
    constructor() {
        this.orderService = new OrderService();
        this.chatService = new ChatService();
        this.view = new HistoryView();
    }
    
    // Business Logic
    async loadOrders(page, status) { }
    async openChat(orderId) { }
    async loadOrderDetail(orderId) { }
    async sendMessage() { }
}
```

---

## 🔷 3. PROFILE MODULE (MVC)

### MVC Structure

```
┌─────────────────────────────────────────┐
│        ProfileController                  │
├─────────────────────────────────────────┤
│ - authService: AuthService              │
│ - view: ProfileView                     │
│ - currentUser: User                      │
├─────────────────────────────────────────┤
│ + init(): Promise<void>                 │
│ + handleProfileUpdate(e): Promise<void> │
│ + updateProfile(data): Promise<void>    │
│ - checkAuth(): Promise<void>            │
│ - loadProfile(): Promise<void>          │
└──────────────┬──────────────────────────┘
               │
               ├────────────────────┐
               │                    │
┌──────────────▼──────────┐  ┌──────▼──────────────┐
│       ProfileView        │  │   AuthService       │
├─────────────────────────┤  │    (Model)           │
│ - profileForm: Form     │  └────────────────────┘
│ - nameInput: Input
│ - emailInput: Input
├─────────────────────────┤
│ + renderProfile(u): void│
│ + showAlert(m, t): void │
│ + getFormData(): Object │
└─────────────────────────┘
```

---

## 🔷 4. APP MODULE (MVC)

### MVC Structure

```
┌─────────────────────────────────────────┐
│              AppController               │
├─────────────────────────────────────────┤
│ - authService: AuthService              │
│ - orderService: OrderService            │
│ - chatService: ChatService              │
│ - view: AppView                         │
├─────────────────────────────────────────┤
│ + init(): Promise<void>                 │
│ + handleLogin(e): Promise<void>         │
│ + handleRegister(e): Promise<void>       │
│ + logout(): Promise<void>               │
│ + handleOrderNow(): void                │
│ - checkAuth(): Promise<void>            │
│ - loadServices(): Promise<void>          │
└──────────────┬──────────────────────────┘
               │
               ├────────────────────┐
               │                    │
┌──────────────▼──────────┐  ┌──────▼──────────────┐
│        AppView           │  │   Services          │
├─────────────────────────┤  │    (Models)         │
│ - loginModal: Modal     │  └────────────────────┘
│ - registerModal: Modal
│ - servicesGrid: Element
├─────────────────────────┤
│ + showLoginModal(): void│
│ + showRegisterModal(): void
│ + renderServices(s): void
│ + getLoginFormData(): Object
│ + getRegisterFormData(): Object
└─────────────────────────┘
```

---

## 🔷 5. ADMIN MODULE (MVC)

### 5.1 Admin Dashboard

```
┌─────────────────────────────────────────┐
│       AdminDashboardController           │
├─────────────────────────────────────────┤
│ - authService: AuthService              │
│ - view: AdminDashboardView              │
│ - currentOrderId: number                 │
├─────────────────────────────────────────┤
│ + init(): Promise<void>                 │
│ + loadDashboardData(): Promise<void>   │
│ + updateOrderStatus(id): Promise<void>  │
│ + viewOrder(id): Promise<void>          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────┐
│   AdminDashboardView    │
├─────────────────────────┤
│ + renderStats(s): void  │
│ + renderRecentOrders(o): void
│ + showStatusModal(id): void
│ + showOrderModal(o): void
└─────────────────────────┘
```

### 5.2 Admin Orders

```
┌─────────────────────────────────────────┐
│        AdminOrdersController             │
├─────────────────────────────────────────┤
│ - authService: AuthService              │
│ - orderService: OrderService            │
│ - view: AdminOrdersView                 │
│ - currentPage: number                   │
│ - currentStatus: string                 │
├─────────────────────────────────────────┤
│ + init(): Promise<void>                 │
│ + loadOrders(): Promise<void>           │
│ + updateStatus(id, status): Promise<void>│
│ + viewOrder(id): Promise<void>          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────┐
│      AdminOrdersView     │
├─────────────────────────┤
│ + renderOrders(o): void │
│ + renderPagination(p): void
│ + showOrderModal(o): void
└─────────────────────────┘
```

---

## 🔷 6. COURIER MODULE (MVC)

### 6.1 Courier Dashboard

```
┌─────────────────────────────────────────┐
│      CourierDashboardController           │
├─────────────────────────────────────────┤
│ - authService: AuthService              │
│ - view: CourierDashboardView            │
│ - currentOrderId: number                 │
├─────────────────────────────────────────┤
│ + init(): Promise<void>                 │
│ + loadDashboardData(): Promise<void>   │
│ + updateOrderStatus(id): Promise<void>  │
│ + viewOrder(id): Promise<void>          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────┐
│   CourierDashboardView   │
├─────────────────────────┤
│ + renderStats(s): void  │
│ + renderOrders(o): void │
│ + showStatusModal(id): void
└─────────────────────────┘
```

---

## 📊 SERVICE LAYER (Models)

Semua Service classes tetap sebagai **Model Layer**:

```
┌─────────────────────────────────────────┐
│           AuthService (Model)            │
├─────────────────────────────────────────┤
│ + login(email, password): Promise       │
│ + register(userData): Promise           │
│ + logout(): Promise                    │
│ + getCurrentUser(): Promise            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          OrderService (Model)             │
├─────────────────────────────────────────┤
│ + getServices(): Promise                │
│ + createOrder(orderData): Promise       │
│ + getUserOrders(page, limit): Promise   │
│ + getOrderDetail(id): Promise           │
│ + confirmPayment(id, data): Promise     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          ChatService (Model)              │
├─────────────────────────────────────────┤
│ + connect(): void                       │
│ + sendMessage(orderId, msg): void       │
│ + getMessages(orderId): Promise         │
│ + joinOrderRoom(orderId): void          │
└─────────────────────────────────────────┘
```

---

## 🔗 Complete MVC Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        MODEL LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ AuthService  │  │ OrderService │  │ ChatService  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ used by
                          │
┌─────────────────────────────────────────────────────────────┐
│                      CONTROLLER LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │OrderController│  │HistoryController│  │ProfileController│    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ AppController│  │AdminDashboard│  │CourierDashboard│   │
│  └──────────────┘  │  Controller  │  │  Controller  │    │
│                    └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ updates
                          │
┌─────────────────────────────────────────────────────────────┐
│                        VIEW LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  OrderView   │  │ HistoryView  │  │ ProfileView  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   AppView    │  │AdminDashboard│  │CourierDashboard│   │
│  └──────────────┘  │    View      │  │     View     │    │
│                    └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ manipulates
                          │
┌─────────────────────────────────────────────────────────────┐
│                        HTML TEMPLATES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  order.html │ history.html │ profile.html │ index.html      │
│  admin/*.html │ courier/*.html                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Folder MVC

```
apps/web/js/
├── models/              (optional - bisa tetap pakai services/)
│   ├── OrderModel.js
│   └── UserModel.js
│
├── views/               ← View classes (DOM manipulation)
│   ├── OrderView.js
│   ├── HistoryView.js
│   ├── ProfileView.js
│   ├── AppView.js
│   ├── admin/
│   │   ├── AdminDashboardView.js
│   │   ├── AdminOrdersView.js
│   │   ├── AdminServicesView.js
│   │   └── AdminLoginView.js
│   └── courier/
│       ├── CourierDashboardView.js
│       └── CourierOrdersView.js
│
├── controllers/         ← Controller classes (business logic)
│   ├── OrderController.js
│   ├── HistoryController.js
│   ├── ProfileController.js
│   ├── AppController.js
│   ├── admin/
│   │   ├── AdminDashboardController.js
│   │   ├── AdminOrdersController.js
│   │   ├── AdminServicesController.js
│   │   └── AdminLoginController.js
│   └── courier/
│       ├── CourierDashboardController.js
│       └── CourierOrdersController.js
│
├── services/            ← Model layer (data access)
│   ├── auth.js
│   ├── order.js
│   └── chat.js
│
└── utils/
    └── ui.js            ← Utility functions
```

---

## ✅ MVC Pattern Rules

### **Controller Rules:**
1. ✅ Handles business logic and coordination
2. ✅ Updates View by calling View methods
3. ✅ Uses Model for data access
4. ✅ Can directly manipulate View (unlike MVP)
5. ✅ Responds to user actions and events

### **View Rules:**
1. ✅ Handles DOM manipulation
2. ✅ Receives data from Controller
3. ✅ Can notify Controller of user events
4. ✅ Should not contain business logic
5. ✅ Provides methods for Controller to call

### **Model Rules:**
1. ✅ Only data access and API calls
2. ✅ No DOM manipulation
3. ✅ No business logic (or minimal)
4. ✅ Returns data, does not update UI

---

## 🔄 MVC Flow

### Typical Request Flow:

```
1. User Action (click button)
   ↓
2. View captures event
   ↓
3. View notifies Controller (via callback)
   ↓
4. Controller processes business logic
   ↓
5. Controller calls Model (for data)
   ↓
6. Model returns data
   ↓
7. Controller updates View (calls View methods)
   ↓
8. View updates DOM
```

### Example: Order Submission

```
User clicks "Create Order"
   ↓
OrderView.setupEventListeners() captures submit
   ↓
OrderView calls callback → OrderController.handleOrderSubmit()
   ↓
OrderController.validate data (business logic)
   ↓
OrderController calls OrderService.createOrder() (Model)
   ↓
OrderService returns result
   ↓
OrderController calls OrderView.showPaymentModal() (View)
   ↓
OrderView updates DOM to show modal
```

---

## 📊 Summary Statistics

- **Total Controllers**: 10
- **Total Views**: 10
- **Total Models**: 3 Services
- **Total Modules**: 10 (Order, History, Profile, App, Admin x4, Courier x2)

---

## 🎯 Key Differences: MVC vs MVP

| Aspect | MVC | MVP |
|--------|-----|-----|
| **Name** | Controller | Presenter |
| **View Access** | Controller can directly call View methods | Presenter calls View via interface |
| **View Updates** | Controller updates View | Presenter updates View |
| **View Independence** | View can have direct references | View is more independent |
| **Pattern** | Classic web pattern | Derived from MVC |

**For Web Development**: MVC is more commonly used and fits better with JavaScript event-driven nature.



