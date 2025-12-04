# Overview

This is a multi-tenant e-commerce platform built with React, Express, and PostgreSQL. The application provides separate dashboards for merchants and administrators, with features for product management, transaction processing, and user management. The platform supports Arabic language (RTL layout) and uses session-based authentication.

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

**Session Management**: Express sessions with secure cookies in production. Session data stores userId and userType (merchant/admin).

**Authentication Flow**: Separate login endpoints for merchants and admins. Password hashing with bcryptjs. No JWT tokens - sessions only.

**Request Processing**: JSON body parsing with raw body buffer for webhook verification. Logging middleware tracks request duration and response status.

**Build System**: ESBuild bundles server with allowlisted dependencies for cold start optimization. Vite builds client with HMR in development.

## Data Layer

**ORM**: Drizzle ORM with PostgreSQL dialect configured for migrations in `./migrations` directory.

**Schema Design**: 
- Merchants table with owner info, store details, status (pending/active/rejected), balance tracking, social links (JSONB)
- Products table linked to merchants
- Transactions for payment/withdrawal tracking
- Admins table for platform administrators
- Supporting tables: customers, orders, orderMessages, reviews, banners, categories, cities, appSettings

**Database Access**: Connection pooling via node-postgres (pg). All queries through Drizzle with type safety from schema definitions.

**Validation**: Zod schemas generated from Drizzle schema using drizzle-zod for insert operations. Validation errors formatted with zod-validation-error.

## External Dependencies

**Database**: PostgreSQL (configured via DATABASE_URL environment variable, required for application startup)

**Session Store**: In-memory sessions in development. Production uses either connect-pg-simple for PostgreSQL-backed sessions or memorystore as fallback.

**File Storage**: Local filesystem for uploads (merchant store images, product images). Files served from dist/public in production.

**Asset Management**: Attached assets stored in separate directory, aliased as @assets in Vite config.

**OpenGraph Images**: Custom Vite plugin updates meta tags with Replit deployment domain for social sharing.

**Development Tools**: 
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal) conditionally loaded in development
- Vite HMR over WebSocket at `/vite-hmr` path

**Build Output**: Client builds to `dist/public`, server bundles to `dist/index.cjs`. Static files served by Express in production with SPA fallback to index.html.