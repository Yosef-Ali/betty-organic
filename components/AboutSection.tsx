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
            src="https://images.unsplash.com/photo-1554080353-a576cf803bda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80"
            alt="Fresh fruits"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative h-64 rounded-lg overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3070&q=80"
            alt="Organic vegetables"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative h-64 rounded-lg overflow-hidden col-span-2">
          <Image
            src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
            alt="Farm fresh produce"
            fill
            className="object-cover"
          />
        </div>
      </div>

    </section>
  );
}
