# Overview

This is a multi-tenant e-commerce platform "غلوردا" (Glorda) built with React, Express, and PostgreSQL. The application provides separate dashboards for merchants and administrators, with features for product management, transaction processing, and user management. The platform supports Arabic language (RTL layout) and uses session-based authentication.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React with TypeScript, Vite as build tool, Wouter for routing, TanStack Query for data fetching.

**UI Framework**: Shadcn/ui components with Radix UI primitives, TailwindCSS for styling, Cairo and Outfit fonts for Arabic and English text.

**State Management**: React Query handles server state with configured defaults (no refetch on window focus, infinite stale time). Form state managed by React Hook Form with Zod validation.

**Routing Strategy**: Client-side routing using Wouter with separate route hierarchies for merchants (`/dashboard/*`) and admins (`/admin/*`). Authentication pages at root level.

**Component Structure**: Layout components wrap page content (DashboardLayout), UI components follow atomic design pattern with shadcn/ui conventions. RTL support built into all components via `dir="rtl"` on root HTML.

## Backend Architecture

**Runtime**: Node.js with Express framework, TypeScript throughout.

**API Design**: RESTful API with `/api/*` prefix. Session-based authentication with middleware guards (`requireMerchant`, `requireAdmin`).

**Session Management**: Express sessions with secure cookies in production. Session data stores userId and userType (merchant/admin). SameSite=lax for CSRF protection.

**Authentication Flow**: Separate login endpoints for merchants and admins. Password hashing with bcryptjs. No JWT tokens - sessions only.

**Request Processing**: JSON body parsing with raw body buffer for webhook verification. Logging middleware tracks request duration and response status.

**Input Validation**: All API endpoints use Zod schemas for input validation. Admin endpoints have strict schema validation to prevent injection attacks.

**Build System**: ESBuild bundles server with allowlisted dependencies for cold start optimization. Vite builds client with HMR in development.

## Data Layer

**ORM**: Drizzle ORM with PostgreSQL dialect configured for migrations in `./migrations` directory.

**Schema Design**: 
- Merchants table with owner info, store details, status (pending/active/rejected), balance tracking, social links (JSONB)
- Products table linked to merchants with customizable options (single choice, text input, toggle)
- Transactions for payment/withdrawal tracking with 5% platform fee
- Admins table for platform administrators
- Discount codes table with percentage/fixed/free_shipping types, usage limits, expiration dates
- Supporting tables: customers, orders, orderMessages, reviews, banners, categories, cities, appSettings, notifications

**Database Access**: Connection pooling via node-postgres (pg). All queries through Drizzle with type safety from schema definitions.

**Validation**: Zod schemas generated from Drizzle schema using drizzle-zod for insert operations. Validation errors formatted with zod-validation-error.

## External Dependencies

**Database**: PostgreSQL (configured via DATABASE_URL environment variable, required for application startup)

**Session Store**: In-memory sessions in development. Production uses connect-pg-simple for PostgreSQL-backed sessions.

**File Storage**: Local filesystem for uploads (merchant store images, product images). Files served from dist/public in production.

**Asset Management**: Attached assets stored in separate directory, aliased as @assets in Vite config.

**Build Output**: Client builds to `dist/public`, server bundles to `dist/index.cjs`. Static files served by Express in production with SPA fallback to index.html.

---

# Deployment Guide (External Hosting)

## Required Environment Variables

The following environment variables must be configured for production deployment:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db`) |
| `SESSION_SECRET` | Yes | Secure random string for session encryption (min 32 chars). Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | Yes | Set to `production` for production builds |
| `PORT` | No | Server port (default: 5000) |

## Build & Deploy Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd <project-folder>

# 2. Install dependencies
npm install

# 3. Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/glorda"
export SESSION_SECRET="your-secure-random-string-min-32-chars"
export NODE_ENV="production"

# 4. Run database migrations
npm run db:push

# 5. Build the application
npm run build

# 6. Start the server
npm start
```

## File Storage Configuration

Uploaded files are stored in the `uploads/` directory:
- `uploads/documents/` - Merchant registration documents (IDs, commercial registrations)
- `uploads/products/` - Product images

**For Cloud Deployment:**
- Configure persistent storage or mount a volume at `/uploads`
- Consider using S3/R2/GCS for scalable file storage (requires code modification)
- Set proper permissions: `chmod -R 755 uploads/`

## Database Setup

### Create Database
```sql
CREATE DATABASE glorda;
```

### Create First Admin Account
```bash
# Generate bcrypt hash for password
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));"
```

```sql
INSERT INTO admins (email, password, name) 
VALUES ('admin@example.com', '<bcrypt-hash-from-above>', 'اسم المدير');
```

## Reverse Proxy Configuration (Nginx Example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Notes

- All passwords are hashed with bcryptjs (10 rounds)
- Sessions stored in PostgreSQL with secure, httpOnly cookies
- CSRF protection via SameSite=lax cookies
- Input validation on all API endpoints using Zod schemas
- Username validation: English characters only
- Document validation: Entity-specific requirements enforced server-side
- HTTPS required in production (secure cookies enabled)
- File upload limits: 10MB for documents, 5MB for product images

---

# What's Missing (To Complete the Project)

## High Priority - Required Before Production

### 1. Email/SMS Service Integration
- **OTP Delivery**: Currently OTP codes are logged to console (dev mode only)
- **Integration needed**: SendGrid, Resend, or Twilio for sending OTP via email/SMS
- **Files to modify**: `server/routes.ts` (forgot-password endpoints)

### 2. Payment Gateway Integration
- **Current state**: Balance is manually managed, no online payments
- **Needed**: Integrate payment provider (Moyasar, Tap, Stripe) for:
  - Customer checkout
  - Automatic balance updates on successful orders
- **Files to modify**: `server/routes.ts`, add payment webhook handlers

### 3. Mobile App API Completion
- **Public API exists** for banners, categories, cities
- **Missing endpoints**:
  - Customer authentication
  - Product browsing by category/merchant
  - Order placement
  - Customer order history
  - Customer reviews

## Medium Priority - Recommended Features

### 4. Real-time Notifications
- **Current**: Notifications stored in database, polled on page load
- **Improvement**: Add WebSocket support for real-time push notifications
- **Files**: Create WebSocket handler in `server/` directory

### 5. Admin Dashboard Analytics
- **Current**: Basic stats available
- **Missing**: Sales charts, merchant performance metrics, revenue reports

### 6. Search Functionality
- **Product search** for customers
- **Merchant search** in admin panel

### 7. Image Optimization
- **Current**: Images stored as-is
- **Improvement**: Add image compression/resizing on upload
- **Consider**: CDN integration for faster delivery

## Low Priority - Nice to Have

### 8. Multi-language Support
- **Current**: Arabic only with RTL layout
- **Future**: Add English language toggle

### 9. Export Features
- Export orders to CSV/Excel
- Export merchant reports

### 10. Advanced Product Options
- Option dependencies (show option B only if option A is selected)
- Option price modifiers

---

# Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (merchant, admin)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
│   └── index.html         # HTML entry point
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── static.ts          # Static file serving
├── shared/                 # Shared code between frontend/backend
│   └── schema.ts          # Drizzle schema + Zod types
├── uploads/               # User uploaded files
│   ├── documents/         # Merchant documents
│   └── products/          # Product images
└── migrations/            # Database migration files
```

# Recent Changes

- **2024-12**: Added discount codes management to App Settings (percentage, fixed amount, free shipping types)
- **2024-12**: Fixed CSRF vulnerability by setting sameSite=lax cookies
- **2024-12**: Fixed error handler to prevent process crashes
- **2024-12**: Added Zod validation to all admin API endpoints
- **2024-12**: Implemented 5% platform fee for merchant withdrawals
- **2024-12**: Added product visibility toggle (active/hidden)
- **2024-12**: Added main image selection for products
