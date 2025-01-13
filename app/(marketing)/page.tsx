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
  try {
    const supabase = createClient();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .abortSignal(controller.signal);
    
    clearTimeout(timeout);
    
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }
    return products || [];
  } catch (error) {
    console.error("Timeout or other error fetching products:", error);
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();
  // Create plain objects from the products
  const plainProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    unit: product.unit,
    created_at: product.created_at,
    updated_at: product.updated_at
  }));
  const serializedProducts = JSON.stringify(plainProducts);

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
              <ProductSection initialProducts={serializedProducts} />
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
