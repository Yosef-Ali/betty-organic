# Delivery App

This is a delivery application built with Next.js 14, Prisma, Zustand, Zod, and Shadcn UI.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Database Setup](#database-setup)
- [Folder Structure](#folder-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/delivery-app.git
    cd delivery-app
    ```

2. Install dependencies:

    ```sh
    pnpm install
    ```

3. Set up environment variables:

    Create a `.env` file in the root directory and add your environment variables.

    ```env
    DATABASE_URL="postgresql://neondb_owner:DH5S1UKtpvWM@ep-young-paper-a8ivxhoi.eastus2.azure.neon.tech/neondb?sslmode=require"
    UPLOADTHING_TOKEN='your_uploadthing_token'
    ```

4. Run Prisma migrations:

    ```sh
    pnpm prisma migrate dev
    ```

## Usage

To start the development server:

    ```sh
    pnpm dev
    ```
To synchronize your Prisma schema with your database and seed it, run the following commands:

    ```sh
    pnpm prisma db push
    pnpm prisma generate
    pnpm prisma db seed
    ```

# betty-organic Project Configuration

## Project Context

betty-organic is a web application designed to provide users with organic product recommendations. The project utilizes a modern tech stack to ensure a seamless user experience.

## Code Style and Structure

- **Code Style**:
  - Write concise, technical TypeScript code with accurate examples.
  - Use functional and declarative programming patterns; avoid classes.
  - Prefer iteration and modularization over code duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`).

- **Directory Structure**:
  - Organize files to promote modularity and reusability.

    ```
    src/
    ├── components/     # Shared React components
    ├── hooks/          # Custom React hooks
    ├── utils/          # Helper functions
    ├── types/          # TypeScript types
    ├── lib/            # Shared libraries
    ├── background/     # Service worker scripts (for Chrome Extension)
    ├── content/        # Content scripts (for Chrome Extension)
    ├── popup/          # Extension popup UI (for Chrome Extension)
    ├── options/        # Extension options page (for Chrome Extension)
    └── storage/        # Chrome storage utilities
    ```

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Chrome Extension Development
- Express.js

## Naming Conventions

- Use lowercase with dashes for directories (e.g., `components/form-wizard`).
- Favor named exports for components and utilities.
- Use PascalCase for component files (e.g., `ProductCard.tsx`).
- Use camelCase for utility files (e.g., `fetchData.ts`).

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use constant objects with 'as const' assertion.
- Use functional components with TypeScript interfaces.
- Define strict types for message passing between different parts of the extension.
- Use absolute imports for all files (`@/...`).
- Avoid try/catch blocks unless there's a good reason to handle errors in that abstraction.
- Use explicit return types for all functions.

## Chrome Extension Specific

- Use Manifest V3 standards.
- Implement proper message passing between components:

  ```typescript
  interface MessagePayload {
    type: string;
    data: unknown;
  }
  ```
