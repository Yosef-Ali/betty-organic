import Link from 'next/link';
import { Button } from '../ui/button';

export function MarketingHeader() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-xl">
          Betty Organic
        </Link>
        <nav className="flex gap-4">
          <Link href="/about">About</Link>
          <Link href="/products">Products</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
      <Button asChild>
        <Link href="/signup">Sign Up</Link>
      </Button>
    </header>
  );
}
