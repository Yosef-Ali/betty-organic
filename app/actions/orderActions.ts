'use server';

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

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

export async function getOrderDetails(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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

export async function createOrder(formData: FormData) {
  const customerId = DEFAULT_CUSTOMER_ID;
  const status = formData.get('status') as string;
  const type = formData.get('type') as string; // This will be either 'store' or 'online'
  const items = JSON.parse(formData.get('items') as string);
  const customerInfo = formData.get('customerInfo') as string;
  const totalAmount = parseFloat(formData.get('totalAmount') as string); // Use totalAmount from formData


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
          email: `${nanoid(8)}@example.com`, // Placeholder email, adjust as needed
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        id: nanoid(8),
        customerId: customer ? customer.id : customerId,
        status,
        type, // This will be 'store' or 'online' as passed from the client
        totalAmount,
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity, // Quantity in grams
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

    revalidatePath('/dashboard/orders');
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

  revalidatePath('/dashboard/orders');
  return updatedOrder;
}

export async function deleteOrder(orderId: string) {
  try {
    // Delete the order items first to avoid foreign key constraint issues
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    // Delete the order
    await prisma.order.delete({
      where: { id: orderId },
    });

    // Revalidate the orders page to reflect the changes
    revalidatePath('/dashboard/orders');

    return { success: true, shouldRefresh: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: 'Failed to delete order', shouldRefresh: false };
  }
}
