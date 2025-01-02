import Footer from 'components/Footer';
import Header from 'components/Header';
import ChatWidget from './ChatWidget';

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode
}) {
  const handleMobileMenuToggle = () => {
    // Handle mobile menu toggle logic here
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header onMobileMenuToggle={handleMobileMenuToggle} />
      <main className="flex-grow">
        {children}
        <ChatWidget />
      </main>
      <Footer />
    </div>
  );
}
