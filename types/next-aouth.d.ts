import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    isVerified?: boolean
  }

  interface Session {
    user: User & {
      role?: string
      isVerified?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    isVerified?: boolean
  }
}
