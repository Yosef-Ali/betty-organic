'use client';

import { FloatingFruit } from './floating-fruit';
import { HeroContent } from './hero/hero-content';
import { HeroImage } from './hero/hero-image';

export function Hero() {
  return (
    <div className="relative w-full min-h-screen mb-8 md:mb-16 overflow-hidden pt-16 md:pt-24">

      <div className="absolute inset-0 w-full h-full grid grid-cols-[repeat(auto-fill,60px)] grid-rows-[repeat(auto-fit,minmax(60px,1fr))] z-0">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-black/10 min-h-[60px]" />
        ))}
      </div>

      <div className="relative h-full py-4 md:py-12">
        <div className="container h-full mx-auto flex flex-col md:grid md:grid-cols-2 items-center gap-4 md:gap-12 px-2 md:px-8">
          <div className="w-full order-2 md:order-none relative z-20">
            <HeroContent />
          </div>
          <div className="w-full flex items-center justify-center order-1 md:order-none relative z-20">
            <HeroImage />
          </div>
        </div>

        <div className="hidden md:block relative z-0">
          <FloatingFruit
            className="absolute top-1/4 left-[15%] opacity-60"
            src="/fruits/apple.png?v=1"
            size={600}
            rotate={15}
          />
          <FloatingFruit
            className="absolute top-1/3 right-[15%] opacity-60"
            src="/fruits/orange.png?v=1"
            size={550}
            rotate={-15}
          />
          <FloatingFruit
            className="absolute bottom-1/4 left-[20%] opacity-60"
            src="/fruits/banana.png?v=1"
            size={650}
            rotate={30}
          />
          <FloatingFruit
            className="absolute bottom-1/3 right-[20%] opacity-60"
            src="/fruits/mango.png?v=1"
            size={580}
            rotate={-20}
          />
        </div>
      </div>
    </div>
  );
}
