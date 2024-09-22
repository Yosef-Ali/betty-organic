'use client'

import SalesPage from '@/components/SalesPage'
// import { useState } from "react"
// import Image from "next/image"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Product } from "@prisma/client"

// interface ProductGridClientProps {
//   initialProducts: Product[]
// }

// export function ProductGridClient({ initialProducts }: ProductGridClientProps) {
//   const [products] = useState<Product[]>(initialProducts)

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <CardTitle>Products</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
//           {products.map((product) => (
//             <div key={product.id} className="overflow-hidden rounded-md">
//               <div className="relative aspect-square">
//                 <Image
//                   src={product.imageUrl}
//                   alt={product.name}
//                   layout="fill"
//                   objectFit="cover"
//                   className="h-auto w-auto object-cover transition-all hover:scale-105"
//                 />
//                 <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
//                   <p className="text-white text-xs text-center px-1">{product.name}</p>
//                   <Badge variant="default" className="mt-1">
//                     {product.stock > 0 ? "In Stock" : "Out of Stock"}
//                   </Badge>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

import { Suspense } from 'react'

export default function ProductsPage() {
  return (

    <Suspense fallback={<div>Loading products...</div>}>
      <div className="flex-1 space-y-4 p-8 pt-4">
        <h2 className="text-2xl font-bold mb-4">Sales Dashboard</h2>
      </div>
      <SalesPage />
    </Suspense>

  )
}
