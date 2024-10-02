import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create or update 5 products (fruits)
  const fruits = [
    { name: 'Apple', price: 1.99, image: 'apple.jpg' },
    { name: 'Banana', price: 0.99, image: 'banana.jpg' },
    { name: 'Orange', price: 1.49, image: 'orange.jpg' },
    { name: 'Mango', price: 2.49, image: 'mango.jpg' },
    { name: 'Strawberry', price: 3.99, image: 'strawberry.jpg' },
  ]

  for (const fruit of fruits) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: fruit.name }
    })

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          price: fruit.price,
          imageUrl: `/uploads/${fruit.image}`,
        },
      })
    } else {
      await prisma.product.create({
        data: {
          name: fruit.name,
          description: `Fresh ${fruit.name.toLowerCase()}`,
          price: fruit.price,
          stock: Math.floor(Math.random() * 100) + 50,
          imageUrl: `/uploads/${fruit.image}`,
        },
      })
    }
  }

  // Create or update 5 customers
  const customers = [
    { name: 'John Doe', email: 'john@example.com', image: 'john.jpg' },
    { name: 'Jane Smith', email: 'jane@example.com', image: 'jane.jpg' },
    { name: 'Alice Johnson', email: 'alice@example.com', image: 'alice.jpg' },
    { name: 'Bob Brown', email: 'bob@example.com', image: 'bob.jpg' },
    { name: 'Eva Williams', email: 'eva@example.com', image: 'eva.jpg' },
  ]

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {
        fullName: customer.name,
        imageUrl: `/uploads/${customer.image}`,
      },
      create: {
        fullName: customer.name,
        email: customer.email,
        phone: String(Math.floor(Math.random() * 9000000000) + 1000000000),
        location: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'][Math.floor(Math.random() * 5)],
        imageUrl: `/uploads/${customer.image}`,
      },
    })
  }

  // Create 5 orders
  const createdCustomers = await prisma.customer.findMany()
  const createdProducts = await prisma.product.findMany()

  for (let i = 0; i < 5; i++) {
    const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)]
    const numItems = Math.floor(Math.random() * 3) + 1
    const orderItems = []
    let totalAmount = 0

    for (let j = 0; j < numItems; j++) {
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)]
      const quantity = Math.floor(Math.random() * 5) + 1
      const price = product.price * quantity
      totalAmount += price

      orderItems.push({
        productId: product.id,
        quantity: quantity,
        price: price,
      })
    }

    await prisma.order.create({
      data: {
        customerId: customer.id,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)],
        type: ['online', 'in-store'][Math.floor(Math.random() * 2)],
        items: {
          create: orderItems,
        },
      },
    })
  }

  // Create or update 5 users
  const users = [
    { name: 'Admin User', email: 'admin@example.com', role: 'admin', image: 'admin.jpg' },
    { name: 'Manager User', email: 'manager@example.com', role: 'manager', image: 'manager.jpg' },
    { name: 'Staff User 1', email: 'staff1@example.com', role: 'staff', image: 'staff1.jpg' },
    { name: 'Staff User 2', email: 'staff2@example.com', role: 'staff', image: 'staff2.jpg' },
    { name: 'Regular User', email: 'user@example.com', role: 'user', image: 'user.jpg' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        image: `/uploads/${user.image}`,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash: 'hashed_password_here', // In a real scenario, you'd use a proper hashing function
        role: user.role,
        isVerified: true,
        image: `/uploads/${user.image}`,
      },
    })
  }

  console.log('Seed data created or updated successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
