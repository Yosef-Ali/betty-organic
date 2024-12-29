import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const products = [
  {
    name: "Fresh Strawberries",
    description: "Sweet and juicy strawberries, perfect for desserts",
    price: 4.99,
    stock: 100,
    imageUrl: "/uploads/strawberry.jpg",
    totalSales: 50
  },
  {
    name: "Organic Bananas",
    description: "Naturally ripened organic bananas",
    price: 2.99,
    stock: 150,
    imageUrl: "/uploads/banana.jpg",
    totalSales: 75
  },
  {
    name: "Red Apples",
    description: "Crisp and sweet red apples",
    price: 3.49,
    stock: 200,
    imageUrl: "/uploads/apple.jpg",
    totalSales: 120
  },
  {
    name: "Ripe Mangoes",
    description: "Sweet and aromatic mangoes",
    price: 5.99,
    stock: 80,
    imageUrl: "/uploads/mango.jpg",
    totalSales: 40
  },
  {
    name: "Fresh Oranges",
    description: "Juicy and vitamin-rich oranges",
    price: 4.49,
    stock: 120,
    imageUrl: "/uploads/orange.jpg",
    totalSales: 90
  },
  {
    name: "Dragon Fruit",
    description: "Exotic dragon fruit with sweet flesh",
    price: 7.99,
    stock: 50,
    imageUrl: "/uploads/dragonfruit.jpg",
    totalSales: 25
  },
  {
    name: "Green Kiwi",
    description: "Tangy and nutritious kiwi fruit",
    price: 3.99,
    stock: 90,
    imageUrl: "/uploads/kiwi.jpg",
    totalSales: 60
  },
  {
    name: "Fresh Pineapple",
    description: "Sweet and tropical pineapple",
    price: 5.49,
    stock: 70,
    imageUrl: "/uploads/pineapple.jpg",
    totalSales: 45
  },
  {
    name: "Purple Grapes",
    description: "Sweet seedless purple grapes",
    price: 4.99,
    stock: 110,
    imageUrl: "/uploads/grape.jpg",
    totalSales: 85
  },
  {
    name: "Fresh Watermelon",
    description: "Sweet and refreshing watermelon",
    price: 6.99,
    stock: 60,
    imageUrl: "/uploads/watermelon.jpg",
    totalSales: 30
  }
]

const customers = [
  {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    imageUrl: "/uploads/avatars/john.jpg",
    location: "New York",
    status: "active"
  },
  {
    fullName: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567891",
    imageUrl: "/uploads/avatars/jane.jpg",
    location: "Los Angeles",
    status: "active"
  },
  {
    fullName: "Bob Johnson",
    email: "bob@example.com",
    phone: "+1234567892",
    imageUrl: "/uploads/avatars/bob.jpg",
    location: "Chicago",
    status: "active"
  }
]

async function main() {
  console.log('Start seeding...')

  // Create products
  console.log('Seeding products...')
  const createdProducts = []
  for (const product of products) {
    const result = await prisma.product.create({
      data: product
    })
    createdProducts.push(result)
    console.log(`Created product with id: ${result.id}`)
  }

  // Create customers
  console.log('Seeding customers...')
  const createdCustomers = []
  for (const customer of customers) {
    const result = await prisma.customer.create({
      data: customer
    })
    createdCustomers.push(result)
    console.log(`Created customer with id: ${result.id}`)
  }

  // Create orders and order items
  console.log('Seeding orders...')
  for (const customer of createdCustomers) {
    // Create 2 orders per customer
    for (let i = 0; i < 2; i++) {
      // Randomly select 1-3 products for each order
      const orderProducts = createdProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1)

      const orderItems = orderProducts.map(product => ({
        productId: product.id,
        quantity: Math.floor(Math.random() * 5) + 1,
        price: product.price
      }))

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          totalAmount,
          status: "completed",
          type: "standard",
          items: {
            create: orderItems
          }
        }
      })
      console.log(`Created order with id: ${order.id}`)
    }
  }

  // Create a test user
  await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      passwordHash: "$2b$10$8OuDs7svYg8fvM5VGDsZpenR1S1LnwzyXIbx9nDmHD8g8N.ZFBrTq", // password: test123
      role: "admin",
      isVerified: true,
      emailVerified: new Date()
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
