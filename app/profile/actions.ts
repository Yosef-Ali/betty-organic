'use server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[... nextauth]/route'

const prisma = new PrismaClient()

export async function updateProfile({ name, email, image }: { name: string, email: string, image?: string }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

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

  return updatedUser
}
