import React from 'react';
import Link from 'next/link';

interface BreadcrumbItemProps {
  href?: string;
  isLast?: boolean;
  children: React.ReactNode;
}

const BreadcrumbItem = ({ href, isLast, children }: BreadcrumbItemProps) => {
  if (isLast) {
    return <span className="text-gray-500">{children}</span>;
  }

  return (
    <Link href={href || '/'} className="text-blue-600 hover:underline">
      {children}
    </Link>
  );
};

const BreadcrumbSeparator = () => <span className="mx-2 text-gray-400">/</span>;

export default function Breadcrumb({ pathSegments }: { pathSegments: string[] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center space-x-1">
        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;

          return (
            <React.Fragment key={href}>
              <li>
                <BreadcrumbItem href={href} isLast={isLast}>
                  {segment}
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
