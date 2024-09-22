'use server';

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const DEFAULT_CUSTOMER_ID = 'cm17ncksy0003juohiaart3s8';

export async function getOrders() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 8,
  });

  return orders;
}

export async function getCustomers() {
  return prisma.customer.findMany();
}

export async function getProducts() {
  return prisma.product.findMany();
}




export async function createOrder(formData: FormData) {
  const customerId = DEFAULT_CUSTOMER_ID;
  const status = formData.get('status') as string;
  const type = formData.get('type') as string; // This will be either 'store' or 'online'
  const items = JSON.parse(formData.get('items') as string);
  const customerInfo = formData.get('customerInfo') as string;

  console.log(`Order type: ${type}`);


  try {
    // First, check if the customer exists
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { fullName: customerInfo },
          { phone: customerInfo }
        ]
      },
    });

    // If customer doesn't exist, create a new one
    if (!customer && customerInfo) {
      customer = await prisma.customer.create({
        data: {
          id: nanoid(8),
          fullName: customerInfo, // Assuming customerInfo is the name, adjust as needed
          phone: customerInfo, // Assuming customerInfo is the phone, adjust as needed
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        id: nanoid(8),
        customerId: customer ? customer.id : customerId,
        status,
        type, // This will be 'store' or 'online' as passed from the client
        totalAmount: items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0),
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrder(id: string, formData: FormData) {
  const customerId = formData.get('customerId') as string;
  const status = formData.get('status') as string;
  const items = JSON.parse(formData.get('items') as string);

  // Delete existing order items
  await prisma.orderItem.deleteMany({
    where: { orderId: id },
  });

  // Update order and create new order items
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      customerId,
      status,
      totalAmount: items.reduce((total: number, item: { price: number; quantity: number }) => total + (item.price * item.quantity), 0),
      items: {
        create: items.map((item: { productId: string; quantity: number; price: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return updatedOrder;
}
