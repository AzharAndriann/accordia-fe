export type AgreementStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type AgreementSnapshot = {
  scope: string;
  deliverables: string[];
  amountRupiah: string;
  deadline: string;
  revisionLimit: number;
  cancellationTerms: string;
  ipTerms: string;
};

export type AgreementVersion = AgreementSnapshot & {
  id: string;
  projectId: string;
  versionNumber: number;
  status: AgreementStatus;
  contentHash: string;
  baseAgreementVersionId: string | null;
  createdById: string;
  rejectedById: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  approvalCount: number;
  createdAt: string;
  updatedAt: string;
};
