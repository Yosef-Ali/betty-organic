"use client";

import { DeliveryServices } from "components/delivery-services";
import Footer from "components/Footer";
import { Hero } from "components/Hero";
import { TestimonialSection } from "components/testimonials/testimonial-section";
import { AboutSection } from "components/AboutSection";
import ChatWidget from "components/ChatWidget";
import Navigation from "@/components/Navigation";
import { ProductSection } from "../products/client/ProductSection";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  unit: string;
}

type HomeClientProps = {
  products: ReadonlyArray<Product>;
}

export function HomeClient({ products }: HomeClientProps) {
  // Convert the products array to a new array to ensure it's a plain object
  const serializedProducts = Array.from(products);

  return (
    <main className="flex flex-col items-center bg-[#ffc600] relative">
      <Navigation />
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
  );
}
