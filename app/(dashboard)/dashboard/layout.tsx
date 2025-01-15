import ProtectedRouteWrapper from '@/components/authentication/protected-route-wrapper';
import DashboardLayoutClient from './layout-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRouteWrapper>
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </ProtectedRouteWrapper>
  );
}
