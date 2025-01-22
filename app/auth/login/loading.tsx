import { AuthSkeleton } from '@/components/skeletons/auth-skeleton';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loading...',
  description: 'Loading authentication page',
};

export default function LoginLoading() {
  return <AuthSkeleton />;
}
