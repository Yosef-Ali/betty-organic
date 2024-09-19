'use client'

import { CardDescription, CardHeader, CardTitle } from '../ui/card'

export default function ProductsHeader() {
  return (
    <CardHeader>
      <CardTitle >Products</CardTitle>
      <CardDescription> Manage your products and view their sales performance.</CardDescription>
    </CardHeader>
  )
}