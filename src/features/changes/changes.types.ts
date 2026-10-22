export type ChangeRequestStatus = 'REQUESTED' | 'PROPOSED' | 'ACCEPTED' | 'REJECTED';

export type AgreementComparison = {
  amountRupiah: { before: string; after: string; difference: string };
  deadline: { before: string; after: string };
};

export type ChangeRequest = {
  id: string;
  projectId: string;
  requestedById: string;
  reason: string;
  baseAgreementVersionId: string;
  proposedVersionId: string | null;
  status: ChangeRequestStatus;
  comparison: AgreementComparison | null;
  createdAt: string;
  updatedAt: string;
};
