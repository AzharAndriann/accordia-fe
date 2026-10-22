import { z } from 'zod';

const deadlineSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Tanggal tidak valid');

export const agreementFormSchema = z.object({
  scope: z.string().trim().min(1, 'Ruang lingkup wajib diisi').max(20_000),
  deliverablesText: z.string().trim().min(1, 'Minimal satu hasil kerja'),
  amountRupiah: z
    .string()
    .regex(/^\d{1,18}$/, 'Nominal harus berupa angka penuh')
    .refine((value) => BigInt(value) > 0n, 'Nominal harus lebih dari nol'),
  deadline: deadlineSchema,
  revisionLimit: z
    .string()
    .regex(/^\d+$/, 'Batas revisi harus berupa angka')
    .refine((value) => Number(value) <= 100, 'Maksimal 100 revisi'),
  cancellationTerms: z.string().trim().min(1, 'Ketentuan pembatalan wajib diisi').max(10_000),
  ipTerms: z.string().trim().min(1, 'Ketentuan hak karya wajib diisi').max(10_000),
}).superRefine((value, context) => {
  const items = value.deliverablesText.split('\n').map((item) => item.trim()).filter(Boolean);
  if (items.length > 20) {
    context.addIssue({ code: 'custom', path: ['deliverablesText'], message: 'Maksimal 20 hasil kerja' });
  }
  if (items.some((item) => item.length > 500)) {
    context.addIssue({ code: 'custom', path: ['deliverablesText'], message: 'Setiap hasil kerja maksimal 500 karakter' });
  }
  if (new Set(items).size !== items.length) {
    context.addIssue({ code: 'custom', path: ['deliverablesText'], message: 'Hasil kerja tidak boleh duplikat' });
  }
});

export type AgreementFormValues = z.infer<typeof agreementFormSchema>;
