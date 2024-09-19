console.log("Users created.");
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create users
  const users = [
    {
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "hashed_password_1",
      role: "user",
      isVerified: false,
      image: "/uploads/john.png",
      lastLoginAt: null,
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      passwordHash: "hashed_password_2",
      role: "admin",
      isVerified: true,
      image: "/uploads/jane.jpg",
      lastLoginAt: new Date(),
    },
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      passwordHash: "hashed_password_3",
      role: "user",
      isVerified: true,
      image: "/uploads/alice.png",
      lastLoginAt: null,
    },
    {
      name: "Bob Brown",
      email: "bob@example.com",
      passwordHash: "hashed_password_4",
      role: "user",
      isVerified: false,
      image: "/uploads/bob.png",
      lastLoginAt: null,
    },
    {
      name: "Charlie Davis",
      email: "charlie@example.com",
      passwordHash: "hashed_password_5",
      role: "user",
      isVerified: false,
      image: "/uploads/charlie.png",
      lastLoginAt: null,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
  // Create products (fruits)
  const products = [
    {
      name: "Apple",
      description: "Fresh red apples",
      price: 1.99,
      stock: 100,
      imageUrl: "/uploads/apple.jpg",
    },
    {
      name: "Banana",
      description: "Organic bananas",
      price: 0.99,
      stock: 150,
      imageUrl: "/uploads/banana.jpg",
    },
    {
      name: "Orange",
      description: "Citrus oranges",
      price: 1.49,
      stock: 120,
      imageUrl: "/uploads/orange.jpg",
    },
    {
      name: "Grapes",
      description: "Seedless grapes",
      price: 2.99,
      stock: 80,
      imageUrl: "/uploads/grapes.jpg",
    },
    {
      name: "Mango",
      description: "Tropical mangoes",
      price: 1.99,
      stock: 60,
      imageUrl: "/uploads/mango.jpg",
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log("Products created.");

  // Create customers
  const customers = [
    {
      fullName: "John Doe",
      email: "john@example.com",
      phone: "123456789",
      imageUrl: "/uploads/example.jpg",
      location: "New York",
    },
    {
      fullName: "Jane Smith",
      email: "jane@example.com",
      phone: "987654321",
      imageUrl: "/uploads/example.jpg",
      location: "California",
    },
    {
      fullName: "Alice Johnson",
      email: "alice@example.com",
      phone: "112233445",
      imageUrl: "/uploads/example.jpg",
      location: "Texas",
    },
    {
      fullName: "Bob Brown",
      email: "bob@example.com",
      phone: "223344556",
      imageUrl: "/uploads/example.jpg",
      location: "Florida",
    },
    {
      fullName: "Charlie Davis",
      email: "charlie@example.com",
      phone: "334455667",
      imageUrl: "/uploads/example.jpg",
      location: "Nevada",
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: customer,
      create: customer,
    });
  }

  console.log("Customers created.");

  // Retrieve products and customers to create orders
  const allProducts = await prisma.product.findMany();
  const allCustomers = await prisma.customer.findMany();

  // Create orders
  for (let i = 0; i < allCustomers.length; i++) {
    const customer = allCustomers[i];
    const product1 = allProducts[i % allProducts.length];
    const product2 = allProducts[(i + 1) % allProducts.length];

    await prisma.order.create({
      data: {
        customerId: customer.id,
        totalAmount: product1.price * 2 + product2.price * 3,
        status: "pending",
        type: "online", // Add this line
        items: {
          create: [
            {
              productId: product1.id,
              quantity: 2,
              price: product1.price,
            },
            {
              productId: product2.id,
              quantity: 3,
              price: product2.price,
            },
          ],
        },
      },
    });
  }

  console.log("Orders created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
