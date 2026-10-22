export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export type PaymentFile = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
};

export type Payment = {
  id: string;
  projectId: string;
  amountRupiah: string;
  submittedById: string;
  status: PaymentStatus;
  reviewedById: string | null;
  note: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  files: PaymentFile[];
};

export type PaymentSummary = {
  agreementAmountRupiah: string;
  confirmedTotalRupiah: string;
  remainingRupiah: string;
  overpaymentRupiah: string;
  isPaid: boolean;
  isOverpaid: boolean;
};

export type PaymentPage = {
  data: Payment[];
  nextCursor: string | null;
  paymentSummary: PaymentSummary;
};

export type PaymentMutationResult = {
  data: Payment;
  paymentSummary: PaymentSummary;
};
