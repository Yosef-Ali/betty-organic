"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MouseEvent, useRef } from "react";
import Image from "next/image";

type FruitAnimation = {
  src: string;
  alt: string;
  className: string;
  animate: {
    x?: number[];
    y?: number[];
    rotate: number[];
  };
  transition: {
    duration: number;
    repeat: number;
    repeatType: "reverse" | "loop" | "mirror";
    ease: string;
  };
};

const floatingFruits: FruitAnimation[] = [
  {
    src: "/fruits/apple.png?v=1",
    alt: "Floating Apple",
    className: "absolute -left-8 top-1/4 w-12 h-12 md:w-20 md:h-20",
    animate: {
      y: [-10, 10],
      rotate: [-5, 5],
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
  {
    src: "/fruits/orange.png?v=1",
    alt: "Floating Orange",
    className: "absolute -right-8 top-1/3 w-10 h-10 md:w-16 md:h-16",
    animate: {
      y: [-15, 15],
      rotate: [10, -10],
    },
    transition: {
      duration: 5,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
  {
    src: "/fruits/banana.png?v=1",
    alt: "Floating Banana",
    className: "absolute right-1/4 -bottom-8 w-14 h-14 md:w-24 md:h-24",
    animate: {
      x: [-10, 10],
      rotate: [-8, 8],
    },
    transition: {
      duration: 6,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
  {
    src: "/fruits/mango.png?v=1",
    alt: "Floating Mango",
    className: "absolute left-1/4 -top-8 w-16 h-16 md:w-28 md:h-28",
    animate: {
      y: [-12, 12],
      rotate: [15, -15],
    },
    transition: {
      duration: 7,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
];

export function HeroImage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [15, -15]), {
    stiffness: 100,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-15, 15]), {
    stiffness: 100,
    damping: 30,
  });

  function handleMouseMove({ clientX, clientY }: MouseEvent) {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    mouseX.set((clientX - left) / width);
    mouseY.set((clientY - top) / height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-[min(90vw,600px)] md:w-[min(45vw,800px)] mx-auto perspective-1000 p-4 md:p-8 z-10"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative w-full aspect-square"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-full w-full overflow-visible rounded-full bg-white/20 shadow-[0_0_50px_rgba(0,0,0,0.15)] backdrop-blur-sm z-10 border-4 border-white/30"
        >
          <div className="relative h-full w-full rounded-full overflow-hidden border-4 border-white/10">
            <Image
              src="/hero-2.png?v=1"
              alt="Fresh fruits"
              fill
              className="object-cover object-center scale-110"
              sizes="(max-width: 768px) 90vw, 45vw"
              priority
            />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/10 to-yellow-500/10" />
        </motion.div>

        {/* Floating Fruits */}
        {floatingFruits.map((fruit, index) => (
          <motion.div
            key={index}
            className={`hidden md:block ${fruit.className} z-30`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              ...fruit.animate,
              opacity: 0.8,
              scale: 1,
            }}
            transition={fruit.transition}
          >
            <div className="relative w-full h-full">
              <Image
                src={fruit.src}
                alt={fruit.alt}
                width={200}
                height={200}
                className="w-full h-full object-contain drop-shadow-xl"
                sizes="(max-width: 768px) 100px, 200px"
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
