export type AuditEventType =
  | 'PROJECT_CREATED'
  | 'INVITATION_CREATED'
  | 'INVITATION_ACCEPTED'
  | 'AGREEMENT_DRAFT_CREATED'
  | 'AGREEMENT_UPDATED'
  | 'AGREEMENT_SUBMITTED'
  | 'AGREEMENT_APPROVED'
  | 'AGREEMENT_ACCEPTED'
  | 'AGREEMENT_REJECTED'
  | 'CHANGE_REQUEST_CREATED'
  | 'CHANGE_REQUEST_PROPOSED'
  | 'FILE_UPLOADED'
  | 'DELIVERY_SUBMITTED'
  | 'DELIVERY_ACCEPTED'
  | 'REVISION_REQUESTED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REJECTED';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type AuditEvent = {
  id: string;
  projectId: string;
  actorId: string;
  actorName: string;
  type: AuditEventType;
  entityType: string;
  entityId: string;
  metadata: JsonValue;
  serverTime: string;
};
