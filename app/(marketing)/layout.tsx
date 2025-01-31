import { Navbar } from '@/components/Navbar';
import { Navigation } from '@/components/Navigation';
import { Suspense } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#ffc600]">
      <Suspense
        fallback={
          <header className="border-b fixed top-0 left-0 right-0 z-50 border-zinc-50">
            <div className="container flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-8">
                <div className="h-6 w-32 animate-pulse rounded" />
                <div className="hidden md:flex items-center gap-6">
                  <div className="h-4 w-16 animate-pulse rounded" />
                  {/* <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" /> */}
                </div>
              </div>
              <div className="h-10 w-10 animate-pulse rounded-full" />
            </div>
          </header>
        }
      >
        {/* <Navbar /> */}
        <Navigation />
      </Suspense>
      <main>{children}</main>
    </div>
  );
}
