import { z } from 'zod';

//const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  CUSTOMER: 'customer',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const signUpSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z
      .enum([UserRole.ADMIN, UserRole.USER, UserRole.CUSTOMER])
      .default(UserRole.CUSTOMER),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignUpFormType = z.infer<typeof signUpSchema>;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z
    .enum([UserRole.ADMIN, UserRole.USER, UserRole.CUSTOMER])
    .default(UserRole.CUSTOMER),
});

export type SignupFormType = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: passwordSchema,
});

export type LoginFormType = z.infer<typeof loginSchema>;

export const resetSchema = z.object({
  email: z.string().email('Invalid email'),
});

export type ResetFormType = z.infer<typeof resetSchema>;
