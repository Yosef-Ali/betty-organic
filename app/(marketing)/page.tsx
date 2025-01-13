import { Metadata } from 'next';
import { DeliveryServices } from "components/delivery-services";
import Footer from "components/Footer";
import { Hero } from "components/Hero";
import { TestimonialSection } from "components/testimonials/testimonial-section";
import { AboutSection } from "components/AboutSection";
import ChatWidget from "components/ChatWidget";
import Navigation from "@/components/Navigation";
import { ProductSection } from "@/components/products/product-section";
import { createClient } from '@/lib/supabase/client';

export const metadata: Metadata = {
  title: 'Betty Organic - Fresh Fruits & Vegetables',
  description: 'Fresh organic fruits and vegetables delivered to your door',
};

export const revalidate = 0;

async function getProducts() {
  const supabase = createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('*');
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return products || [];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <Navigation />
      <main className="flex flex-col items-center bg-[#ffc600] relative">
        <section id="hero">
          <Hero />
        </section>
        <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            <section id="products">
              <ProductSection initialProducts={products} />
            </section>
            <section id="about">
              <AboutSection />
            </section>
            <section id="delivery-services">
              <DeliveryServices />
            </section>
            <section id="testimonials">
              <TestimonialSection />
            </section>
          </div>
        </div>
        <Footer />
        <ChatWidget />
      </main>
    </>
  );
}
