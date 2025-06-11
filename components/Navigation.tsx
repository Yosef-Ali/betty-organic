import Link from 'next/link';
import Image from 'next/image';
import { getUser } from '@/app/actions/auth'; // Corrected import
import { getProfile } from '@/app/actions/profile'; // Added profile import
import { NavbarUserSection } from './NavbarUserSection';
import { MobileMenu } from './MobileMenu';

export async function Navigation() {
  const user = await getUser(); // Use getUser
  // Fetch profile separately if user exists
  const profile = user ? await getProfile(user.id) : null;

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Pass fetched user and profile */}
          <MobileMenu user={user} profile={profile} />
          <Link
            href="/"
            className="text-2xl md:text-2xl font-bold relative group flex items-center gap-2"
          >
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <Image
                src="/logo.jpeg"
                alt="Betty's Organic Logo"
                fill
                className="rounded-full object-cover"
                sizes="(max-width: 768px) 32px, 40px"
              />
            </div>
            <span className="relative z-10 text-base md:text-lg lg:text-2xl">
              Betty&apos;s Organic
            </span>
            <div className="absolute -bottom-2 left-0 w-full h-2 bg-[#e65f00] opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left z-0"></div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-lg font-medium relative group">
              <span className="relative z-10">Home</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="#products"
              className="text-lg font-medium relative group"
            >
              <span className="relative z-10">Products</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link href="#about" className="text-lg font-medium relative group">
              <span className="relative z-10">About</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="#contact"
              className="text-lg font-medium relative group"
            >
              <span className="relative z-10">Contact</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/amharic-ocr"
              className="text-lg font-medium relative group text-blue-600 hover:text-blue-800"
            >
              <span className="relative z-10">አማርኛ OCR</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
          {/* Pass fetched user and profile */}
          <NavbarUserSection
            user={user}
            profile={profile}
          />
        </div>
      </div>
    </nav>
  );
}
