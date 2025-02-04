import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Providers from './providers';

export const metadata = {
  title: "Betty's Organic",
  description: 'Fresh organic fruits and vegetables delivered to your door',
};

async function initializeApp() {
  try {
    const response = await fetch('/api/init', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
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
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
