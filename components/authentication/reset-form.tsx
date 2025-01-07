'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resetSchema, ResetFormType } from "@/lib/definitions"
import { resetPassword } from "@/app/actions/authActions"
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

export function ResetForm() {
  const form = useForm<ResetFormType>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          const result = await resetPassword(data);
          if (result?.error) {
            form.setError("email", { message: result.error });
          }
        })}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Enter your email to reset password</p>
        </div>
        <div className="grid gap-4">
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
          <Button type="submit" className="w-full">Reset Password</Button>
        </div>
      </form>
    </Form>
  )
}
