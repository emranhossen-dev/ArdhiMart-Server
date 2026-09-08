# ⚡ ArdhiMart Backend — Scalable E-Commerce REST API & Real-time Engine

[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real_Time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT_Passport-black?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

A modular, enterprise-grade **REST API & Real-time Backend** built with **NestJS 11**, **Prisma ORM**, and **TypeScript**. Powers the entire ArdhiMart multi-channel e-commerce ecosystem including customer storefronts, admin dashboards, inventory automation, and courier integrations.

---

## 📌 Project Overview

**ArdhiMart Backend** provides a high-throughput, secure, and extensible API server for complete e-commerce lifecycle management. It is designed to handle high concurrency during marketing campaigns, with automated SKU generation, atomic bulk product onboarding, real-time WebSocket order notifications, inventory locking, and fraud prevention.

### 🌐 Live Links & Endpoints
- **Live Production API**: [https://ardhimart-backend.onrender.com/api/v1](https://ardhimart-backend.onrender.com/api/v1)
- **Storefront Website**: [https://ardhimart.com](https://ardhimart.com)
- **Admin Management Panel**: [https://admin.ardhimart.com](https://admin.ardhimart.com)

---

## 🏗️ Architecture & Database Blueprint

```text
       +-----------------------+       +-----------------------+
       |   Next.js Storefront  |       |   React 19 Admin SPA  |
       +-----------+-----------+       +-----------+-----------+
                   |                               |
                   +---------------+---------------+
                                   |  (REST + WebSockets)
                                   v
             +-------------------------------------------+
             |         NestJS 11 API Gateway             |
             |  - JWT Auth Guard   - Validation Pipes    |
             |  - Socket.IO Gate   - Exception Filters   |
             +---------------------+---------------------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
              v                    v                    v
      [Products & Bulk]     [Order Lifecycle]    [Coupons & Deals]
      [Inventory Engine]    [Courier Webhook]    [Audit Logs CMS ]
              |                    |                    |
              +--------------------+--------------------+
                                   |
                                   v
             +-------------------------------------------+
             |            Prisma ORM Client              |
             +---------------------+---------------------+
                                   |
                                   v
             +-------------------------------------------+
             |       cPanel MySQL / PostgreSQL DB        |
             +-------------------------------------------+
```

---

## ✨ Main Features

- ⚡ **AI-Optimized Bulk Product API (`POST /products/bulk`)**: Supports creating up to 10 products in a single batch with automatic 11-char SKU formatting (`XXX-XXX-XXX`), unicode slugification (Bengali & English), and database category alignment.
- 📦 **Catalog & Inventory Engine**: Category hierarchies, live stock reservations, low-stock threshold triggers, and buying vs selling margin metrics.
- 🛒 **Full Order State Machine**: Complete tracking through `Pending` ➔ `Confirmed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` ➔ `Returned` / `Cancelled`.
- 🔄 **Real-Time WebSocket Events**: Live order alerts and inventory synchronization powered by `@nestjs/websockets` and Socket.IO.
- 🚚 **Courier Integration Ready**: Modular courier handlers supporting Pathao, Steadfast, and custom fulfillment webhooks.
- 🎫 **Smart Discount & Coupon Engine**: Percentage & fixed discounts, minimum cart values, usage limits, and expiration date checks.
- 🏷️ **Dynamic Banner & Deals CMS**: Manage homepage hero sliders, flash sale countdowns, and section deals.
- 🛡️ **Security & Role-Based Access (RBAC)**: JWT authentication with Passport, password hashing using Bcrypt, CORS protection, and input sanitization via `class-validator`.

---

## 🛠️ Main Technologies & Stack

- **Core Framework**: [NestJS 11](https://nestjs.com/) (Node.js framework with Express adapter)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & ORM**: [Prisma ORM 6.4](https://www.prisma.io/) + MySQL / PostgreSQL
- **Real-Time Protocol**: [Socket.IO](https://socket.io/) (`@nestjs/platform-socket.io`)
- **Authentication**: Passport JWT (`passport-jwt`, `@nestjs/jwt`, `bcrypt`)
- **Validation**: `class-validator` & `class-transformer`
- **Email Service**: Nodemailer

---

## 📦 Key Dependencies

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `@nestjs/core` & `@nestjs/common` | `^11.0.1` | Core enterprise application framework |
| `@prisma/client` & `prisma` | `^6.4.0` | Next-generation ORM and query builder |
| `@nestjs/jwt` & `passport-jwt` | `^11.0.2` | Stateless token authentication & strategy |
| `bcrypt` | `^6.0.0` | Secure cryptographic password hashing |
| `@nestjs/websockets` & `socket.io`| `^11.2.3` | Bidirectional real-time socket gateway |
| `class-validator` & `class-transformer` | `^0.15.1` | Declarative DTO validation & serialization |
| `nodemailer` | `^10.0.0` | Transactional email notifications |
| `firebase-admin` | `^14.2.0` | Server-side Firebase integration |

---

## 🚀 Local Machine Setup & Run Guideline

Follow these steps to set up and run the backend locally:

### 1. Clone the Repository
```bash
git clone https://github.com/ardhimart/ardhimart-backend.git
cd ardhimart-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
PORT=4000
NODE_ENV=development

# Database Connection (MySQL / PostgreSQL via Prisma)
DATABASE_URL="mysql://username:password@localhost:3306/ardhimart_db"

# JWT Authentication Secrets
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRATION="7d"

# Client CORS Origins
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://ardhimart.com,https://admin.ardhimart.com"

# SMTP Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
```

### 4. Database Setup & Prisma Migration
```bash
# Push the Prisma schema directly to your database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Run the Server
```bash
# Development mode with hot-reload
npm run start:dev

# Production build & start
npm run build
npm run start:prod
```

API will be live at: [http://localhost:4000/api](http://localhost:4000/api)

---

## 📂 Project Structure

```text
src/
├── auth/                # JWT Auth strategies, guards & controllers
├── products/            # Product CRUD, Bulk Create API & SKU generators
├── categories/          # Hierarchical category management
├── orders/              # Order lifecycle, status mutations & webhooks
├── inventory/           # Stock alerts & inventory synchronization
├── coupons/             # Discount logic & coupon validation
├── banners/             # Promotional banners & deals CMS
├── reviews/             # Customer product reviews & ratings
├── settings/            # Storewide configuration & delivery fees
├── prisma/              # PrismaService & database connection module
├── gateway/             # WebSocket gateway for real-time events
└── main.ts              # App bootstrap, CORS & global validation pipes
```

---

## 📄 License & Ownership
Copyright © 2026 **ArdhiMart E-Commerce Ecosystem**. All rights reserved.
