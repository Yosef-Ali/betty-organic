"use client";

import { DeliveryServices } from "components/delivery-services";
import Footer from "components/Footer";
import Header from "components/Header";
import { Hero } from "components/Hero";

import { ProductSection } from "components/products/product-section";
import { TestimonialSection } from "components/testimonials/testimonial-section";
import { AboutSection } from "components/AboutSection";
import ChatWidget from "components/ChatWidget";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Navigation from "@/components/Navigation";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Example:
    // supabase.auth.getUser().then(({ data }) => {
    //   if (data.user && data.user.role === 'admin') setIsAdmin(true);
    // });
  }, []);

  return (
    <main className="flex flex-col items-center bg-[#ffc600] relative">
      <Navigation isAdmin={isAdmin} />
      <section id="hero">
        <Hero />
      </section>
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="space-y-32">
          <section id="products">
            <ProductSection />
          </section>
          <div className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 opacity-20">
              <Image
                src="/pattern.svg"
                alt="Decorative pattern"
                width={288}
                height={288}
                className="object-cover"
              />
            </div>
            <DeliveryServices />
          </div>
          <section id="about">
            <AboutSection />
          </section>
          <section id="contact">
            <TestimonialSection />
          </section>
        </div>
      </div>
      <ChatWidget />
      <Footer />
    </main>
  );
}
