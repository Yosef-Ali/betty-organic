import { Metadata } from 'next';
import { DeliveryServices } from 'components/delivery-services';
import Footer from 'components/Footer';
import { Hero } from 'components/Hero';
import { TestimonialsWrapper } from '@/components/testimonials/testimonials-wrapper';
import { AboutSection } from 'components/AboutSection';
import ChatWidget from 'components/ChatWidget';
import { ProductSection } from '@/components/products/product-section';
import { Product } from '@/lib/supabase/db.types';
import { getProducts } from '@/app/actions/productActions';

export const metadata: Metadata = {
  title: 'Betty Organic - Fresh Fruits & Vegetables',
  description: 'Fresh organic fruits and vegetables delivered to your door',
};

// Increase revalidation time to reduce load on the database
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let initialProducts: Product[] = [];
  let error = null;

  try {
    initialProducts = await getProducts();
  } catch (e) {
    console.error('Failed to fetch initial products:', e);
    error = e instanceof Error ? e.message : 'Unable to load products at this time. Please try again later.';
  }

  return (
    <>
      <main className="flex flex-col items-center bg-[#ffc600] relative">
        <Hero />
        <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            <section id="products">
              <ProductSection
                initialProducts={initialProducts}
                error={error}
              />
            </section>
            <section id="about">
              <AboutSection />
            </section>
            <section id="delivery-services">
              <DeliveryServices />
            </section>
            <section id="testimonials">
              <TestimonialsWrapper />
            </section>
          </div>
        </div>
        <Footer />
        <ChatWidget />
      </main>
    </>
  );
}
