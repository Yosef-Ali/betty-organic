import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: "Authentication - Betty's Organic",
    template: "%s - Betty's Organic",
  },
  description: "Authentication pages for Betty's Organic platform",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen antialiased">
      {/*
        Render auth pages with consistent styling.
        The nested pages will handle their own specific layouts.
      */}
      {children}

      {/* Add radial gradient for background effect */}
      <div
        className="fixed bottom-0 left-0 right-0 top-0 bg-background -z-50"
        style={{
          backgroundImage:
            'radial-gradient(at center top, rgba(255, 198, 0, 0.1), transparent 50%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
