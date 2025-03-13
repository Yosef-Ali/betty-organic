import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Authentication | Betty's Organic",
  description: 'Sign in or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
