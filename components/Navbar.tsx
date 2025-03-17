import { getCurrentUser } from '@/app/actions/auth';
import { NavbarUserSection } from './NavbarUserSection';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export async function Navbar() {
  try {
    // Auth Flow Step 1: Get current user data from auth action
    const authData = await getCurrentUser();
    const user = authData?.user || null;
    const profile = authData?.profile || null;

    // The rest of the component uses this auth data
    return (
      <header className="border-b bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500" />
              SaaS Platform
            </a>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium hover:text-primary transition-colors relative group"
                >
                  {label}
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
                </a>
              ))}
            </nav>
          </div>
          <NavbarUserSection user={user} profile={profile} />
        </div>
      </header>
    );
  } catch (error) {
    console.error('Navbar error:', error);
    return (
      <header className="border-b bg-red-50/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-500" />
              SaaS Platform
            </a>
            <p className="text-sm text-red-600">Unable to load navigation</p>
          </div>
          <NavbarUserSection user={null} profile={null} />
        </div>
      </header>
    );
  }
}
