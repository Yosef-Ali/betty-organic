'use server';

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

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
  const customerId = formData.get('customerId') as string;
  const status = formData.get('status') as string;
  const type = formData.get('type') as string; // New: Get order type from formData
  const items = JSON.parse(formData.get('items') as string);

  const order = await prisma.order.create({
    data: {
      id: nanoid(8), // Generate a short, unique ID
      customerId,
      status,
      type, // New: Include the order type
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