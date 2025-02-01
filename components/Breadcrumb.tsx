import React from 'react';
import Link from 'next/link';

interface BreadcrumbItemProps {
  href?: string | null;
  isLast?: boolean;
  children: React.ReactNode;
}

const BreadcrumbItem = ({ href, isLast, children }: BreadcrumbItemProps) => {
  const baseClasses = 'truncate max-w-[120px] sm:max-w-none';
  if (isLast) {
    return <span className={`text-gray-500 ${baseClasses}`}>{children}</span>;
  }

  return (
    <Link href={href || '/'} className={`text-blue-600 hover:underline ${baseClasses}`}>
      {children}
    </Link>
  );
};

const BreadcrumbSeparator = () => <span className="mx-1 sm:mx-2 text-gray-400">/</span>;

export default function Breadcrumb({ pathSegments }: { pathSegments: Array<{ label: string; href: string | null }> }) {
  return (
    <nav aria-label="breadcrumb" className="min-w-0 flex-1">
      <ol className="flex items-center space-x-1 min-w-0">
        {pathSegments.map(({ label, href }, index) => {
          const isLast = index === pathSegments.length - 1;

          return (
            <React.Fragment key={href || index}>
              <li className="min-w-0 flex-shrink">
                <BreadcrumbItem href={href} isLast={isLast}>
                  {label}
                </BreadcrumbItem>
              </li>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
