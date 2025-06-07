import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Providers from './providers';
import { AuthData } from '@/components/providers/AuthData'; // Import AuthData
import { ImprovedAuthProvider } from '@/components/providers/ImprovedAuthProvider'; // Import ImprovedAuthProvider
import { getUser } from '@/app/actions/auth'; // Import getUser
import { getProfile } from '@/app/actions/profile'; // Import getProfile

export const metadata = {
  title: "Betty's Organic",
  description: 'Fresh organic fruits and vegetables delivered to your door',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  let profile = null;
  
  try {
    user = await getUser();
    profile = user ? await getProfile(user.id) : null;
  } catch (error) {
    // Silently handle auth errors - user will be null for public pages
    console.warn('Auth check failed in layout:', error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <AuthData>
          <ImprovedAuthProvider user={user} profile={profile}>
            <Providers>
              {children}
            </Providers>
          </ImprovedAuthProvider>
        </AuthData>
      </body>
    </html>
  );
}
