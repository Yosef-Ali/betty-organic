"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

interface FloatingFruitProps {
  src: string;
  alt?: string;
  className?: string;
  size?: number;
  rotate?: number;
}

export function FloatingFruit({
  src,
  alt = "Floating fruit",
  className = "",
  size = 100,
  rotate = 0
}: FloatingFruitProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className={`absolute overflow-hidden pointer-events-none select-none z-0 ${className}`}
      animate={{
        x: mousePosition.x * 0.02,
        y: mousePosition.y * 0.02,
        rotate: mousePosition.x * 0.02 + rotate,
      }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain w-full h-full opacity-30"
        sizes={`${size}px`}
        priority
      />
    </motion.div>
  );
}
