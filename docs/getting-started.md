# Getting Started

This guide will help you set up and run the Betty Organic App locally.

## Prerequisites

- Node.js 18.x or later
- pnpm (recommended) or npm
- Supabase account
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/betty-organic-app.git
cd betty-organic-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

1. Start the development server:
```bash
pnpm dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
betty-organic-app/
├── app/                 # Next.js app directory
├── components/          # React components
├── contexts/           # React contexts
├── lib/                # Utility functions
├── public/             # Static assets
├── store/             # State management
├── styles/            # Global styles
└── types/             # TypeScript types
```

## Available Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm seed`: Seed the database

## Development Workflow

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: add your feature"
```

3. Push your changes:
```bash
git push origin feature/your-feature-name
```

4. Create a pull request on GitHub

## Code Style

- Use TypeScript for type safety
- Follow the ESLint configuration
- Use Prettier for code formatting
- Follow component naming conventions
