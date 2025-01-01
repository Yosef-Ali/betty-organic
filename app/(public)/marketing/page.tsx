
import DeliveryServices from "@/components/DeliveryServices";
import Hero from "@/components/Hero";
import ProductSection from "@/components/ProductSection";
import TestimonialSection from "@/components/TestimonialSection";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <Hero />
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="space-y-32">
          <ProductSection />
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
          <TestimonialSection />
        </div>
      </div>
    </main>
  );
}
