'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsPage() {
  const pathname = usePathname();

  const tabs = [
    { name: 'General', href: '/dashboard/settings' },
    { name: 'Knowledge Base', href: '/dashboard/settings/knowledge-base' },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="border-b border-gray-200">
        {/* Tab Navigation */}
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`${pathname === tab.href
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
