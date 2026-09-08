# ArdhiMart Backend - Scalable E-Commerce REST API and Real-time Engine

[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real_Time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT_Passport-black?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

A modular, enterprise-grade REST API and real-time backend service built with NestJS 11, Prisma ORM, and TypeScript. Powers the complete ArdhiMart e-commerce ecosystem including customer storefronts, inventory automation, order fulfillment, and courier integrations.

---

## Project Overview

ArdhiMart Backend provides a high-throughput, secure, and extensible API server for complete e-commerce lifecycle management. It is engineered to handle high concurrency during promotional campaigns, with automated SKU generation, atomic bulk product onboarding, real-time WebSocket order notifications, inventory reservation, and fraud prevention.

### Live Links and Endpoints
- Live Production API: [https://ardhimart-backend.onrender.com/api/v1](https://ardhimart-backend.onrender.com/api/v1)
- Storefront Website: [https://ardhimart.com](https://ardhimart.com)

---

## Architecture and Database Blueprint

```text
       +-----------------------------------------------+
       |             Next.js Storefront App            |
       +-----------------------+-----------------------+
                               |
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
      [Products and Bulk]   [Order Lifecycle]    [Coupons and Deals]
      [Inventory Engine]    [Courier Webhook]    [Audit Logs CMS   ]
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

## Main Features

- Bulk Product Creation API (`POST /products/bulk`): Supports batch creation of up to 10 products with automatic 11-character SKU formatting (`XXX-XXX-XXX`), unicode slugification (Bengali and English), and database category alignment.
- Catalog and Inventory Engine: Category hierarchies, live stock reservations, low-stock threshold triggers, and buying vs selling margin metrics.
- Complete Order State Machine: End-to-end lifecycle tracking through Pending, Confirmed, Processing, Shipped, Delivered, Returned, and Cancelled.
- Real-Time WebSocket Events: Live order alerts and inventory synchronization powered by `@nestjs/websockets` and Socket.IO.
- Courier Integration Ready: Modular courier handlers supporting Pathao, Steadfast, and custom fulfillment webhooks.
- Smart Discount and Coupon Engine: Percentage and fixed discounts, minimum cart values, usage limits, and expiration date checks.
- Dynamic Banner and Deals CMS: Manage homepage hero sliders, flash sale countdowns, and section deals.
- Security and Role-Based Access: JWT authentication with Passport, password hashing using Bcrypt, CORS protection, and input sanitization via `class-validator`.

---

## Technologies and Stack

- Core Framework: NestJS 11 (Node.js framework with Express adapter)
- Language: TypeScript
- Database and ORM: Prisma ORM 6.4 with MySQL / PostgreSQL
- Real-Time Protocol: Socket.IO (`@nestjs/platform-socket.io`)
- Authentication: Passport JWT (`passport-jwt`, `@nestjs/jwt`, `bcrypt`)
- Validation: `class-validator` and `class-transformer`
- Email Service: Nodemailer

---

## Key Dependencies

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `@nestjs/core` and `@nestjs/common` | `^11.0.1` | Core enterprise application framework |
| `@prisma/client` and `prisma` | `^6.4.0` | Next-generation ORM and query builder |
| `@nestjs/jwt` and `passport-jwt` | `^11.0.2` | Stateless token authentication and strategy |
| `bcrypt` | `^6.0.0` | Secure cryptographic password hashing |
| `@nestjs/websockets` and `socket.io`| `^11.2.3` | Bidirectional real-time socket gateway |
| `class-validator` and `class-transformer` | `^0.15.1` | Declarative DTO validation and serialization |
| `nodemailer` | `^10.0.0` | Transactional email notifications |

---

## Local Machine Setup and Run Guideline

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
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://ardhimart.com"
```

### 4. Database Setup and Prisma Migration
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

# Production build and start
npm run build
npm run start:prod
```

API will be live at: [http://localhost:4000/api](http://localhost:4000/api)

---

## Project Structure

```text
src/
├── auth/                # JWT Auth strategies, guards and controllers
├── products/            # Product CRUD, Bulk Create API and SKU generators
├── categories/          # Hierarchical category management
├── orders/              # Order lifecycle, status mutations and webhooks
├── inventory/           # Stock alerts and inventory synchronization
├── coupons/             # Discount logic and coupon validation
├── banners/             # Promotional banners and deals CMS
├── settings/            # Storewide configuration and delivery fees
├── prisma/              # PrismaService and database connection module
├── gateway/             # WebSocket gateway for real-time events
└── main.ts              # App bootstrap, CORS and global validation pipes
```

---

## License and Ownership
Copyright 2026 ArdhiMart E-Commerce Ecosystem. All rights reserved.
