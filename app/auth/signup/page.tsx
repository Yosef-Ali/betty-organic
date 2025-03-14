'use client'

import { useRouter } from 'next/navigation'
import { signUp } from '@/app/actions/auth'
import { SignupForm, SignupFormType } from "@/components/authentication/signup-form"
import { toast } from 'sonner'
import Image from "next/image"
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()

  const handleSubmit = async (values: SignupFormType) => {
    try {
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      formData.append('full_name', values.full_name)

      const result = await signUp(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success('Please check your email to verify your account')
        router.push('/auth/verify')  // Redirect to verification page
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Signup failed. Please try again.')
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
            <SignupForm onSubmit={handleSubmit} />
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/fruits/orange.jpg"
          alt="Signup background"
          width={1200}
          height={1200}
          priority
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
