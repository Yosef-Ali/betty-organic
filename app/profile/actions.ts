'use server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function updateProfile({ name, email, image }: { name: string, email: string, image?: string }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        name,
        email,
        image,
      },
    })

    // Revalidate the profile page to reflect the changes
    revalidatePath('/profile')

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Failed to update profile:', error)
    return { success: false, error: 'Failed to update profile' }
  } finally {
    await prisma.$disconnect()
  }
}
