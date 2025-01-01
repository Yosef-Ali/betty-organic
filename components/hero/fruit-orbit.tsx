"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const fruits = [
  { src: "/fruits/apple.png?v=1", alt: "Apple", size: "h-12 w-12" },
  { src: "/fruits/banana.png?v=1", alt: "Banana", size: "h-14 w-14" },
  { src: "/fruits/orange.png?v=1", alt: "Orange", size: "h-10 w-10" },
];

export function FruitOrbit() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fruits.map((fruit, index) => {
        const angle = (rotation + (index * 360) / fruits.length) * (Math.PI / 180);
        const radius = 150;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const scale = (Math.sin(angle) + 2) / 2;

        return (
          <motion.img
            key={fruit.alt}
            src={fruit.src}
            alt={fruit.alt}
            className={`absolute left-1/2 top-1/2 ${fruit.size}`}
            style={{
              x,
              y,
              scale,
              zIndex: Math.round(scale * 10),
            }}
            animate={{
              rotateY: rotation * 2,
              rotateX: rotation,
            }}
            transition={{ duration: 0 }}
          />
        );
      })}
    </div>
  );
}