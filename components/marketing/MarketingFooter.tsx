import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t p-4 mt-8">
      <div className="container flex flex-col items-center gap-4 text-center">
        <div className="flex gap-4">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Betty Organic. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
