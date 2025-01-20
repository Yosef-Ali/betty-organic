'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { resetPassword } from '@/app/auth/actions/authActions'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ResetFormType = z.infer<typeof formSchema>

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ResetFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ResetFormType) => {
    try {
      setIsSubmitting(true)
      const { error, success, message } = await resetPassword(data)

      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        setSubmitted(true)
        toast.success(message || 'Reset instructions sent to your email')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Failed to send reset instructions. Please try again.')
    } finally {
      setIsSubmitting(false)
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
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                {submitted
                  ? "Check your email for reset instructions."
                  : "Enter your email to receive password reset instructions."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@example.com"
                              type="email"
                              autoComplete="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-4">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Sending...
                          </div>
                        ) : (
                          'Send Reset Instructions'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <Link href="/auth/login">
                          Back to Login
                        </Link>
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    If an account exists for {form.getValues('email')}, you will receive password reset instructions.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href="/auth/login">
                      Back to Login
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
