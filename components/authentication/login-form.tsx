'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoginFormType, loginSchema } from "@/lib/definitions"
import { login } from "@/app/actions/authActions"

export function LoginForm() {
  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (data) => {
        const result = await login(data);
        if (result?.error) {
          form.setError("email", { message: result.error });
        }
      })} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground">Enter your email and password</p>
        </div>
        <div className="grid gap-4">
          {/* Email field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Password field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Login</Button>
        </div>
      </form>
    </Form>
  )
}
