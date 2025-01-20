# Architecture Overview

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Context + Hooks
- **Forms**: React Hook Form
- **API**: Next.js API Routes
- **Deployment**: Vercel

## Project Structure

```
betty-organic-app/
├── app/
│   ├── (dashboard)/     # Dashboard routes
│   ├── api/            # API routes
│   ├── auth/           # Auth pages
│   └── layout.tsx      # Root layout
├── components/
│   ├── ui/            # Reusable UI components
│   ├── forms/         # Form components
│   └── dashboard/     # Dashboard components
├── lib/
│   ├── supabase/      # Supabase client & config
│   ├── utils/         # Utility functions
│   └── hooks/         # Custom hooks
├── types/             # TypeScript types
└── store/            # State management
```

## Key Components

### 1. App Router (app/)
- Modern Next.js routing system
- Server components by default
- Nested layouts
- Route groups
- Loading and error states

### 2. Components
- Atomic design principles
- Reusable UI components
- Form components
- Layout components
- Feature components

### 3. Authentication
- Supabase Auth integration
- Protected routes
- Role-based access
- Session management
- Middleware protection

### 4. Database
- Supabase PostgreSQL
- Row Level Security
- Real-time subscriptions
- Type-safe queries
- Migrations

### 5. State Management
- React Context for global state
- Custom hooks for local state
- TypeScript for type safety
- Optimistic updates
- Cache management

## Design Patterns

### 1. Server Components
- Default to server components
- Use client components when needed
- Streaming and suspense
- Progressive enhancement

### 2. Data Fetching
- Server-side fetching
- Incremental Static Regeneration
- Cache strategies
- Error handling

### 3. Security
- Authentication middleware
- CSRF protection
- Input validation
- Error sanitization
- Rate limiting

### 4. Performance
- Image optimization
- Code splitting
- Bundle optimization
- Cache strategies
- Lazy loading

## Development Practices

### 1. Code Organization
- Feature-based structure
- Clear separation of concerns
- Consistent naming conventions
- Type safety

### 2. Testing Strategy
- Unit tests for utilities
- Component tests
- Integration tests
- E2E tests
- API tests

### 3. State Management
- Context for global state
- Local state when possible
- Optimistic updates
- Type-safe actions

### 4. Error Handling
- Error boundaries
- Type-safe error handling
- User-friendly messages
- Logging and monitoring
