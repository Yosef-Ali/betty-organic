import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Betty's Organic",
  description: 'Fresh organic fruits and vegetables delivered to your door',
};

async function initializeApp() {
  try {
    const response = await fetch('/api/init');
    if (!response.ok) {
      throw new Error('Failed to initialize app');
    }
  } catch (error) {
    console.error('App initialization error:', error);
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize app on client side
  if (typeof window !== 'undefined') {
    initializeApp();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.className} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
