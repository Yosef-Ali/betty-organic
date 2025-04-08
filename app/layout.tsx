import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Providers from './providers';
import { FacebookSDK } from '@/components/FacebookSDK';
import { AuthData } from '@/components/providers/AuthData'; // Import AuthData
import { AuthProvider } from '@/components/providers/AuthProvider'; // Import AuthProvider
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
  const user = await getUser();
  const profile = user ? await getProfile(user.id) : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <AuthData>
          <AuthProvider user={user} profile={profile}>
            <Providers>
              <FacebookSDK />
              {children}
            </Providers>
          </AuthProvider>
        </AuthData>
      </body>
    </html>
  );
}
