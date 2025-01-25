import NavigationServer from '@/components/NavigationServer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationServer />
      <main className="flex-1 mt-16">{children}</main>
    </div>
  );
}
