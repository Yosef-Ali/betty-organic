import { Metadata } from 'next';
import { DeliveryServices } from 'components/delivery-services';
import Footer from 'components/Footer';
import { Hero } from 'components/Hero';
import { TestimonialsWrapper } from '@/components/testimonials/testimonials-wrapper';
import { AboutSection } from 'components/AboutSection';
import ChatWidget from 'components/ChatWidget';
import { ProductSection } from '@/components/products/product-section';
import { Product } from '@/lib/supabase/db.types';
import { getProducts } from './actions';

export const metadata: Metadata = {
  title: 'Betty Organic - Fresh Fruits & Vegetables',
  description: 'Fresh organic fruits and vegetables delivered to your door',
};

export const revalidate = 0;

export default async function Home() {
  const initialProducts = await getProducts();

  return (
    <>
      <main className="flex flex-col items-center bg-[#ffc600] relative border border-red-400">
        <Hero />
        <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            <section id="products">
              <ProductSection initialProducts={initialProducts} />
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
