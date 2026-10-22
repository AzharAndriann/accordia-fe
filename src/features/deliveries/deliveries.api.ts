import { authenticatedRequest } from '@/lib/api';
import type { ApiSuccess, CursorPage } from '@/types/api';

import type { Delivery } from './deliveries.types';

export const deliveryKeys = {
  all: ['deliveries'] as const,
  list: (projectId: string) => [...deliveryKeys.all, projectId, 'list'] as const,
};

export function listDeliveries(projectId: string, cursor?: string, limit = 20) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<CursorPage<Delivery>>(`/projects/${projectId}/deliveries?${query.toString()}`);
}

export function createDelivery(
  projectId: string,
  input: { agreementVersionId: string; note: string; fileIds: string[]; links: string[] },
) {
  return authenticatedRequest<ApiSuccess<Delivery>>(`/projects/${projectId}/deliveries`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function acceptDelivery(deliveryId: string) {
  return authenticatedRequest<ApiSuccess<Delivery>>(`/deliveries/${deliveryId}/accept`, { method: 'POST' });
}

export function requestDeliveryRevision(deliveryId: string, reason: string) {
  return authenticatedRequest<ApiSuccess<Delivery>>(`/deliveries/${deliveryId}/request-revision`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
