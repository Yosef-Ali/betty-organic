# Betty Organic App

A modern organic products delivery application built with Next.js 14, Supabase, TypeScript, and Tailwind CSS.

## Features

- 🔐 Authentication with Google OAuth and Supabase
- 📱 Responsive design optimized for mobile and desktop
- 🛒 Product catalog with organic food items
- 📋 Order management system
- 👥 Customer management dashboard
- 🎨 Modern UI with Shadcn/ui components
- 🔧 TypeScript for type safety

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Styling**: Tailwind CSS + Shadcn/ui
- **Language**: TypeScript
- **State Management**: React hooks and Context
- **Deployment**: Vercel

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd betty-organic-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Site Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   PORT=3000
   ```

## Development Setup

### 1. Supabase Configuration

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Authentication > Settings > Auth
3. Configure Site URL: `http://localhost:3000` (for development)
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (for production)

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
6. Add redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

### 3. Database Setup

The app uses Supabase for database management. Tables and relationships are automatically handled through Supabase's interface.

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. The app will automatically run on port 3000 as configured in `.env.local`

## Project Structure

```
betty-organic-app/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/                # Auth group routes
│   │   ├── login/             # Login page
│   │   └── register/          # Registration page
│   ├── (dashboard)/           # Dashboard group routes
│   │   └── dashboard/         # Protected dashboard area
│   │       ├── customers/     # Customer management
│   │       ├── orders/        # Order management
│   │       └── products/      # Product management
│   ├── actions/               # Server actions
│   │   └── auth.ts           # Authentication actions
│   ├── auth/                  # Auth callback handlers
│   │   └── callback/         # OAuth callback route
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/                # Reusable UI components
│   ├── ui/                   # Shadcn/ui components
│   └── ...                   # Custom components
├── lib/                      # Utility libraries
│   ├── supabase/            # Supabase configuration
│   │   ├── client.ts        # Client-side Supabase
│   │   ├── server.ts        # Server-side Supabase
│   │   └── database.types.ts # Database types
│   └── utils.ts             # Utility functions
├── middleware.ts            # Next.js middleware for auth
├── .env.local              # Environment variables
└── package.json            # Dependencies and scripts
```

## Authentication System

The app uses a hybrid authentication system:

- **Primary**: Supabase Auth with Google OAuth
- **Session Management**: Server-side session handling
- **Route Protection**: Middleware-based auth checks

### Key Authentication Functions

Located in `app/actions/auth.ts`:

- `signInWithGoogle()` - Google OAuth login with environment detection
- `signOut()` - User logout
- `getCurrentUser()` - Get current authenticated user
- `getSession()` - Get current session

## Development Notes

### Environment Detection

The authentication system automatically detects the environment:
- **Local Development**: Uses `http://localhost:3000` for redirects
- **Production**: Uses the production URL for redirects

### Port Configuration

The application is configured to run on port 3000 consistently:
- Set in `.env.local` with `PORT=3000`
- Ensures OAuth redirects work correctly

### Common Issues & Solutions

1. **OAuth Redirect Issues**:
   - Ensure Supabase Site URL matches your development URL
   - Add all redirect URLs to both Supabase and Google Cloud Console

2. **Environment Variables**:
   - Use `.env.local` for development (not tracked in git)
   - Ensure `NEXT_PUBLIC_SITE_URL` matches your current environment

3. **TypeScript Errors**:
   - Database types are auto-generated by Supabase
   - Import types from `lib/supabase/database.types.ts`

## Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
