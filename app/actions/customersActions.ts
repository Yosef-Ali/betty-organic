'use server'

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { Customer } from '@prisma/client'

export async function uploadImage(data: FormData) {
  const file: File | null = data.get('file') as unknown as File

  if (!file) {
    throw new Error('No file uploaded')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Ensure the upload directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = path.join(uploadDir, file.name);
  await fs.promises.writeFile(filename, buffer);
  return `/uploads/${file.name}` // This should be a valid URL
}

export async function createCustomer(formData: FormData) {
  const customer = await prisma.customer.create({
    data: {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      location: formData.get('location') as string || null,
      status: formData.get('status') as 'active' | 'inactive',
      imageUrl: formData.get('imageUrl') as string || null,
    },
  })
  revalidatePath('/dashboard/customers')
  return customer
}

export async function updateCustomer(data: {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  location?: string | null
  status: 'active' | 'inactive'
  imageUrl?: string | null
}) {
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
  })
  revalidatePath('/dashboard/customers')
  return customer
}

export async function getCustomerImage(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { imageUrl: true }
  });
  return customer ? customer.imageUrl : null;
}

export async function getCustomers() {
  return await prisma.customer.findMany()
}

export async function getCustomer(id: string) {
  return await prisma.customer.findUnique({
    where: { id },
  })
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to delete customer:', error)
    return { success: false, error: 'Failed to delete customer' }
  }
}



export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })
    return customer // This line is crucial
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}