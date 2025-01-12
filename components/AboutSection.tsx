"use client";

import Image from "next/image";

export function AboutSection() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      {/* Text Content Column */}
      <div className="space-y-6">
        <h2 className="text-4xl font-bold">About Betty&#39;s Organic</h2>
        <p className="text-lg">
          At Betty&#39;s Organic, we&#39;re passionate about bringing you the freshest,
          most nutritious produce straight from local farms. Our commitment to
          organic farming practices ensures that every fruit and vegetable is
          grown without harmful chemicals, preserving both your health and the
          environment.
        </p>
        <p className="text-lg">
          Founded in 2010, we&#39;ve grown from a small family farm to a trusted
          source for organic produce in the community. Our team carefully selects
          each item, ensuring only the highest quality reaches your table.
        </p>
      </div>

      {/* Image Gallery Column */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative h-64 rounded-lg overflow-hidden">
          <Image
            src="/fruits/fruit1.jpg"
            alt="Fresh fruits"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative h-64 rounded-lg overflow-hidden">
          <Image
            src="/fruits/fruit2.jpg"
            alt="Organic vegetables"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative h-64 rounded-lg overflow-hidden col-span-2">
          <Image
            src="/fruits/fruit3.jpg"
            alt="Farm fresh produce"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
