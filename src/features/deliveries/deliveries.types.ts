export type DeliveryStatus = 'PENDING' | 'REVISION_REQUESTED' | 'ACCEPTED';

export type DeliveryFile = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
};

export type RevisionRequest = {
  id: string;
  requestedById: string;
  reason: string;
  roundNumber: number;
  createdAt: string;
};

export type Delivery = {
  id: string;
  projectId: string;
  agreementVersionId: string;
  submittedById: string;
  note: string;
  links: string[];
  status: DeliveryStatus;
  submittedAt: string;
  reviewedAt: string | null;
  files: DeliveryFile[];
  revisionRequest: RevisionRequest | null;
};
