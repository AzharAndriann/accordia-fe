import { authenticatedRequest } from '@/lib/api';
import type { ApiSuccess, CursorPage } from '@/types/api';

import type { AgreementSnapshot, AgreementVersion } from './agreements.types';

export const agreementKeys = {
  all: ['agreements'] as const,
  list: (projectId: string) => [...agreementKeys.all, projectId, 'list'] as const,
};

export function listAgreementVersions(projectId: string, cursor?: string, limit = 20) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<CursorPage<AgreementVersion>>(
    `/projects/${projectId}/agreement-versions?${query.toString()}`,
  );
}

export function createAgreementVersion(
  projectId: string,
  snapshot: AgreementSnapshot & { changeRequestId?: string },
) {
  return authenticatedRequest<ApiSuccess<AgreementVersion>>(`/projects/${projectId}/agreement-versions`, {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
}

export function updateAgreementVersion(versionId: string, snapshot: AgreementSnapshot) {
  return authenticatedRequest<ApiSuccess<AgreementVersion>>(`/agreement-versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify(snapshot),
  });
}

export function submitAgreementVersion(versionId: string, expectedActiveVersionId: string | null) {
  return authenticatedRequest<ApiSuccess<AgreementVersion>>(`/agreement-versions/${versionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ expectedActiveVersionId }),
  });
}

export function approveAgreementVersion(versionId: string, contentHash: string) {
  return authenticatedRequest<ApiSuccess<AgreementVersion>>(`/agreement-versions/${versionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ contentHash }),
  });
}

export function rejectAgreementVersion(versionId: string, reason: string) {
  return authenticatedRequest<ApiSuccess<AgreementVersion>>(`/agreement-versions/${versionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
