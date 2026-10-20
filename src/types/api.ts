export type ApiSuccess<T> = { data: T };
export type ApiErrorBody = { error: { code: string; message: string } };
export type CursorPage<T> = { data: T[]; nextCursor: string | null };

export type ProjectRole = 'FREELANCER' | 'CLIENT';
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export type ProjectSummary = {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  status: ProjectStatus;
  role: ProjectRole;
  activeAgreementVersionId: string | null;
  createdAt: string;
  updatedAt: string;
};
