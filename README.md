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
