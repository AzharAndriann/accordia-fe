import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi')
  .max(254, 'Email terlalu panjang')
  .email('Format email belum benar')
  .transform((email) => email.toLowerCase());

export const authRoles = ['FREELANCER', 'CLIENT'] as const;
export type AuthRole = (typeof authRoles)[number];

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password wajib diisi').max(128, 'Password terlalu panjang'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter'),
    email: emailSchema,
    role: z.enum(authRoles, { message: 'Pilih peran akun' }),
    password: z
      .string()
      .min(12, 'Password minimal 12 karakter')
      .max(128, 'Password maksimal 128 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
