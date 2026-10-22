import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .max(254, 'Email terlalu panjang')
    .email('Format email tidak valid')
    .transform((email) => email.toLowerCase()),
});

export const invitationTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'Token undangan tidak valid');

export type CreateInvitationForm = z.input<typeof createInvitationSchema>;
