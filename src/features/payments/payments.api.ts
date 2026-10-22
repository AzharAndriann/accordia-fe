import { authenticatedRequest } from '@/lib/api';

import type { PaymentMutationResult, PaymentPage } from './payments.types';

export const paymentKeys = {
  all: ['payments'] as const,
  list: (projectId: string) => [...paymentKeys.all, projectId, 'list'] as const,
};

export function listPayments(projectId: string, cursor?: string, limit = 20) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<PaymentPage>(`/projects/${projectId}/payments?${query.toString()}`);
}

export function createPayment(
  projectId: string,
  input: { amountRupiah: string; fileIds: string[]; note: string },
) {
  return authenticatedRequest<PaymentMutationResult>(`/projects/${projectId}/payments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function confirmPayment(paymentId: string) {
  return authenticatedRequest<PaymentMutationResult>(`/payments/${paymentId}/confirm`, { method: 'POST' });
}

export function rejectPayment(paymentId: string, reason: string) {
  return authenticatedRequest<PaymentMutationResult>(`/payments/${paymentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
