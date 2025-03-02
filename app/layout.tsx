import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Providers from './providers';
import { FacebookSDK } from '@/components/FacebookSDK';

export const metadata = {
  title: "Betty's Organic",
  description: 'Fresh organic fruits and vegetables delivered to your door',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers>
          <FacebookSDK />
          {children}
        </Providers>
      </body>
    </html>
  );
}
