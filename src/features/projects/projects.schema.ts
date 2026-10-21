import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Judul minimal 3 karakter')
    .max(160, 'Judul maksimal 160 karakter'),
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi wajib diisi')
    .max(5_000, 'Deskripsi maksimal 5000 karakter'),
});

export type CreateProjectForm = z.infer<typeof createProjectSchema>;
