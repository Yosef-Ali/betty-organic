import { z } from "zod"

//const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type SignUpFormType = z.infer<typeof signUpSchema>

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2)
})

export type SignupFormType = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: passwordSchema,
})

export type LoginFormType = z.infer<typeof loginSchema>

export const resetSchema = z.object({
  email: z.string().email("Invalid email"),
})

export type ResetFormType = z.infer<typeof resetSchema>
