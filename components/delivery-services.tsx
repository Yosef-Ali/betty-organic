"use client";

import { motion } from "framer-motion";
import { Truck, Clock, Shield } from "lucide-react";
import Image from "next/image";

const services = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Same-day delivery available for orders placed before 2 PM"
  },
  {
    icon: Clock,
    title: "24/7 Service",
    description: "Round-the-clock customer support and delivery tracking"
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "100% satisfaction guaranteed or your money back"
  }
];

export function DeliveryServices() {
  return (
    <section className="py-16 bg-gradient-to-br from-orange-50/50 to-transparent relative overflow-hidden">
      {/* Decorative Pattern - Top Left Quarter Circle */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] opacity-50">
        <div className="relative w-full h-full">
          <svg width="100%" height="100%" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            <circle cx="0" cy="0" r="500" fill="none" stroke="#FF8C00" strokeWidth="30" strokeDasharray="70 40" />
            <circle cx="0" cy="0" r="400" fill="none" stroke="#FF8C00" strokeWidth="25" strokeDasharray="60 30" />
            <circle cx="0" cy="0" r="300" fill="none" stroke="#FF8C00" strokeWidth="20" strokeDasharray="50 25" />
          </svg>

        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">Our Delivery Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience seamless fruit delivery with our premium services designed for your convenience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Delivery Boy Image */}
          <motion.div
            className="relative h-[300px] lg:h-[400px] rounded-2xl overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Image
              src="/delivery-boy.jpg"
              alt="Young delivery boy on motorbike"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">Swift & Safe Delivery</h3>
              <p className="text-white/90">Our dedicated team ensures your fruits arrive fresh and on time</p>
            </div>
          </motion.div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                className="flex items-start gap-4 group"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                  <service.icon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
