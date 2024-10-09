'use server'

import { UTApi } from "uploadthing/server";
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

const utapi = new UTApi();

export async function uploadImage(data: FormData) {
  const file = data.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const response = await utapi.uploadFiles([file]);
    if (!response.length || !response[0].data || !response[0].data.url) {
      throw new Error("Failed to upload image");
    }

    const fileUrl = response[0]?.data?.url;
    return fileUrl; // Return the URL of the uploaded image
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}

export async function createCustomer(formData: FormData) {
  try {
    const customer = await prisma.customer.create({
      data: {
        fullName: formData.get('fullName') as string,
        email: (formData.get('email') as string) || '',
        phone: (formData.get('phone') as string) || '',
        location: (formData.get('location') as string) || '',
        status: formData.get('status') as 'active' | 'inactive',
        imageUrl: formData.get('imageUrl') as string || null,
      },
    });
    revalidatePath('/dashboard/customers');
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

export async function updateCustomer(data: {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  status: 'active' | 'inactive';
  imageUrl?: string | null;
}) {
  try {
    const customer = await prisma.customer.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        location: data.location,
        status: data.status,
        imageUrl: data.imageUrl,
      },
    });
    revalidatePath('/dashboard/customers');
    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
}

export async function getCustomerImage(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { imageUrl: true },
    });
    return customer ? customer.imageUrl : null;
  } catch (error) {
    console.error('Error fetching customer image:', error);
    throw new Error('Failed to fetch customer image');
  }
}

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany();
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
}

export async function getCustomer(id: string) {
  try {
    return await prisma.customer.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id },
    });
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return { success: false, error: 'Failed to delete customer' };
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });
    return customer; // This line is crucial
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function searchCustomers(query: string) {
  if (!query) {
    return [];
  }

  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { fullName: { contains: query.toLowerCase() } },
          { phone: { contains: query } },
        ],
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        phone: true,
        imageUrl: true,
      },
    });

    if (!customers || !Array.isArray(customers)) {
      console.error('Unexpected result from Prisma query:', customers);
      return [];
    }

    const result = customers.map(customer => ({
      ...customer,
      fullName: customer.fullName.toLowerCase().includes(query.toLowerCase())
        ? customer.fullName
        : customer.fullName,
    }));

    console.log('Processed result:', result);
    return result;
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return [];
  }
}
