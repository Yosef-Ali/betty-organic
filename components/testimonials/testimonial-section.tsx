"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Food Enthusiast",
    image: "https://i.pravatar.cc/150?img=1",
    content: "The quality of fruits from FruitMart is exceptional. Every delivery feels like it's picked fresh from the garden!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Health Coach",
    image: "https://i.pravatar.cc/150?img=2",
    content: "I recommend FruitMart to all my clients. Their organic selection is unmatched, and the delivery is always on time.",
    rating: 5
  },
  {
    name: "Emma Davis",
    role: "Restaurant Owner",
    image: "https://i.pravatar.cc/150?img=3",
    content: "As a restaurant owner, quality is everything. FruitMart consistently delivers the freshest fruits for our dishes.",
    rating: 5
  },
  {
    name: "Alex Thompson",
    role: "Fitness Trainer",
    image: "https://i.pravatar.cc/150?img=4",
    content: "The variety and quality of fruits available at FruitMart is amazing. My post-workout smoothies have never been better!",
    rating: 5
  },
  {
    name: "Sophia Martinez",
    role: "Nutrition Expert",
    image: "https://i.pravatar.cc/150?img=5",
    content: "I love how FruitMart sources locally when possible. The seasonal fruit boxes are a fantastic way to eat healthy!",
    rating: 5
  }
];

export function TestimonialSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const scrollTo = (index: number) => {
    api?.scrollTo(index);
  };

  // Calculate number of dots based on screen size and total items
  const numDots = Math.ceil(testimonials.length / 4); // 4 items per view on xl screens

  return (
    <section id="testimonials" className="w-full py-8 md:py-16 lg:py-24">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12 lg:mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold">What Our Customers Say</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700">
            Don't just take our word for it - hear from our satisfied customers about their experience with FruitMart.
          </p>
        </motion.div>

        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Card className="border-none bg-white/80 shadow-lg">
                    <CardContent className="flex flex-col gap-4 p-6">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{testimonial.name}</h3>
                          <p className="text-sm text-gray-600">{testimonial.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-gray-700">{testimonial.content}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-4 top-1/2 h-12 w-12 -translate-y-1/2 border-2 border-[#cc9d00] bg-[#e6b000] hover:bg-[#cc9d00] focus:bg-[#cc9d00] disabled:opacity-50 md:-left-8 lg:-left-12 xl:-left-16" />
            <CarouselNext className="absolute -right-4 top-1/2 h-12 w-12 -translate-y-1/2 border-2 border-[#cc9d00] bg-[#e6b000] hover:bg-[#cc9d00] focus:bg-[#cc9d00] disabled:opacity-50 md:-right-8 lg:-right-12 xl:-right-16" />
          </Carousel>

          {/* Dot indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: numDots }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${current === index
                  ? 'bg-[#e6b000] w-6'
                  : 'bg-[#ffd966] hover:bg-[#e6b000]'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
