# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking without emitting files

### Testing
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Database & Setup
- `npm run seed` - Seed the database with initial data
- `npm run db:create-reviews` - Create Google reviews table

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router and Server Actions
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with Google OAuth integration
- **UI**: Shadcn/ui components with Tailwind CSS
- **State Management**: Zustand for client state, React hooks for server state
- **Image Handling**: UploadThing for file uploads, Gemini AI for image generation

### Directory Structure & Routing
The app uses Next.js App Router with route groups:

- `app/(marketing)/` - Public marketing pages (home, products)
- `app/(dashboard)/` - Protected admin/sales dashboard
- `app/auth/` - Authentication flows (login, signup, callbacks)
- `app/actions/` - Server Actions for data mutations
- `app/api/` - API routes for external integrations

### Authentication & Authorization System
The app implements a sophisticated role-based auth system:

- **Middleware** (`middleware.ts`): Handles route protection and role-based access
- **Roles**: `admin`, `sales`, `customer` with hierarchical permissions
- **Session Management**: Server-side with Supabase SSR cookies
- **Profile System**: Extended user profiles in `profiles` table with roles and status

Key auth patterns:
- Use `createClient()` from `lib/supabase/client.ts` for client-side operations
- Use `createServerClient()` from `lib/supabase/server.ts` for server-side operations
- Server Actions should validate user permissions before mutations

### Database Schema & Relationships
Core entities and their relationships:

- **Users/Profiles**: Extended user data with roles (`admin`, `sales`, `customer`)
- **Products**: Organic food items with images, pricing, and availability
- **Orders**: Customer orders with line items and status tracking
- **Customers**: Customer management system for sales team
- **Testimonials**: Customer reviews and Google Reviews integration

Critical database patterns:
- All tables use RLS policies for security
- Foreign key relationships enforce data integrity
- Status fields use enums for consistency
- Image URLs are stored for Supabase Storage integration

### Image Generation & Management
The app includes AI-powered image generation:

- **Gemini AI Integration**: Generate product images from descriptions
- **UploadThing**: Handle file uploads and storage
- **Image Optimization**: Multiple remote patterns configured in `next.config.mjs`
- **Server Actions**: `upload-image.ts`, `productImage.ts` for image operations

### State Management Patterns
- **Server State**: Server Actions + React Server Components for data fetching
- **Client State**: Zustand stores for shopping cart, UI state
- **Form State**: React Hook Form with Zod validation schemas
- **Error Handling**: Error boundaries with custom fallback components

### Key Architectural Decisions
1. **Server-First Approach**: Maximize use of Server Components and Server Actions
2. **Type Safety**: Strict TypeScript with generated Supabase types
3. **Security**: RLS policies, role-based middleware, input validation
4. **Performance**: Optimized queries, image optimization, lazy loading
5. **Error Handling**: Comprehensive error boundaries and user feedback

## Development Patterns

### Server Actions Location & Naming
Server Actions are organized by feature in `app/actions/`:
- `auth.ts` - Authentication operations
- `productActions.ts` - Product CRUD operations
- `orderActions.ts` - Order management
- `customerActions.ts` - Customer management
- `*Actions.ts` - Follow this naming convention

### Component Organization
- `components/ui/` - Reusable Shadcn/ui components
- `components/[feature]/` - Feature-specific components
- `components/` - Shared business logic components

### Type Definitions
- `lib/supabase/database.types.ts` - Auto-generated Supabase types
- `lib/types/` - Custom TypeScript interfaces
- `app/types/` - App-specific type definitions

### Error Handling Strategy
- Server Actions return `{ success: boolean, error?: string, data?: T }` format
- Client components use Error Boundaries for fallback UI
- Toast notifications for user feedback via Sonner

### Security Considerations
- All mutations require authentication via middleware
- RLS policies enforce data access controls
- Input validation using Zod schemas
- CSRF protection via Server Actions
- Environment variables for sensitive configuration

### Performance Optimizations
- Server Components for data fetching when possible
- Optimized database queries in `lib/database/optimized-queries.ts`
- Image optimization configured for multiple CDNs
- Lazy loading for non-critical components