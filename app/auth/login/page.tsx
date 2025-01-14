'use client'
import { useRouter } from 'next/navigation'
import { login } from '@/app/actions/authActions'
import { LoginForm } from '@/components/authentication/login-form'
import { LoginFormType } from '@/lib/definitions'
import Image from 'next/image'
import { useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  const handleSubmit = async (data: LoginFormType) => {
    try {
      const { error, success, redirectTo } = await login({ 
        email: data.email, 
        password: data.password 
      })

      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success('Login successful')
        // Add a small delay to ensure the cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push(redirectTo || '/')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    }
  }

  return (
    <div className="grid h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/logo.jpeg"
              alt="Company Logo"
              width={24}
              height={24}
              className="rounded-md"
            />
            Betty&apos;s Organic
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onSubmit={handleSubmit} />
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <a href="/auth/signup" className="font-medium text-primary hover:underline">
                Sign up
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/fruits/orange.jpg"
          alt="Login background"
          width={1200}
          height={1200}
          priority
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
