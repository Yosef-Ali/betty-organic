// //import { ProductTable } from '@/components/ProductTable'
// import { Suspense } from 'react'

// export default function ProductsPage() {
//   return (
//     <div>
//       <h2 className="text-2xl font-bold mb-4">Products</h2>
//       {/* <Suspense fallback={<div>Loading products...</div>}>
//         <ProductTable />
//       </Suspense> */}
//     </div>
//   )
// }
import { Suspense } from 'react'
import { ProductTable } from '@/components/ProductTable'

export default function ProductsPage() {
  return (

    <Suspense fallback={<div>Loading products...</div>}>
      <ProductTable />
    </Suspense>

  )
}
