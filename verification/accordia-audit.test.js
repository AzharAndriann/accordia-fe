// Regression tests for the fixes implemented on 2 November 2026.
// Run from accordia-fe: bun --no-env-file test ./verification/accordia-audit.test.js
// No application boot, environment module, network, or real database is used.
import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import {
  invitationProjectParamsSchema,
  invitationParamsSchema,
  projectInvitationParamsSchema,
} from '../../accordia-be/src/modules/invitations/invitation.schema.ts';
import { createPrismaDeliveryRepository } from '../../accordia-be/src/modules/deliveries/delivery.repository.ts';
import { createPrismaInvitationRepository } from '../../accordia-be/src/modules/invitations/invitation.repository.ts';
import { createPrismaAgreementRepository } from '../../accordia-be/src/modules/agreements/agreement.repository.ts';
import { createFileStorage, MAX_FILE_SIZE } from '../../accordia-be/src/modules/files/file.storage.ts';

const projectId = '11111111-1111-4111-8111-111111111111';
const invitationId = '22222222-2222-4222-8222-222222222222';
const now = new Date('2026-11-02T00:00:00Z');
const transactionDatabase = (tx) => ({ $transaction: async (callback) => callback(tx) });

describe('regressions', () => {
  test('BUG-01 fixed: combined route schema accepts both valid IDs and rejects unknown params', () => {
    const params = { projectId, invitationId };
    expect(projectInvitationParamsSchema.safeParse(params).success).toBe(true);
    expect(projectInvitationParamsSchema.safeParse({ ...params, extra: true }).success).toBe(false);
  });

  test('BUG-02 fixed: accepting paid delivery completes project', async () => {
    let projectStatus = 'ACTIVE';
    let paymentReads = 0;
    const row = {
      id: invitationId, projectId, agreementVersionId: 'version', submittedById: 'freelancer',
      note: '', links: ['https://example.com/result'], status: 'PENDING',
      submittedAt: now, reviewedAt: null, files: [], revisionRequest: null,
      project: { status: 'ACTIVE', members: [{ role: 'CLIENT' }] },
    };
    const tx = {
      delivery: {
        findUnique: async () => row,
        updateMany: async ({ data }) => { Object.assign(row, data); return { count: 1 }; },
        findUniqueOrThrow: async () => row,
      },
      project: {
        findUnique: async () => ({ activeAgreementVersion: { amountRupiah: '1000' } }),
        update: async ({ data }) => { projectStatus = data.status; return data; },
      },
      payment: {
        aggregate: async () => { paymentReads++; return { _sum: { amountRupiah: '1000' } }; },
      },
      projectMember: { findMany: async () => [] },
      auditEvent: { create: async ({ data }) => data },
    };
    const result = await createPrismaDeliveryRepository(transactionDatabase(tx)).accept({
      deliveryId: row.id, userId: 'client', now,
    });
    expect(result.status).toBe('ACCEPTED');
    expect(paymentReads).toBe(1);
    expect(projectStatus).toBe('COMPLETED');
  });

  test('BUG-03 fixed: cancellation records audit event', async () => {
    let auditWrites = 0;
    const tx = {
      invitation: {
        findFirst: async () => ({
          id: invitationId, projectId, acceptedAt: null, cancelledAt: null,
          expiresAt: new Date('2026-11-03T00:00:00Z'),
        }),
        updateMany: async () => ({ count: 1 }),
      },
      projectMember: { findMany: async () => [] },
      auditEvent: { create: async () => { auditWrites++; return { id: 'event' }; } },
    };
    const result = await createPrismaInvitationRepository(transactionDatabase(tx)).cancel({
      projectId, invitationId, inviterId: 'freelancer', now,
    });
    expect(result.cancelledAt).toEqual(now);
    expect(auditWrites).toBe(1);
  });
});

describe('review: approval protections at repository level', () => {
  const row = () => ({
    id: invitationId, status: 'PENDING', approvals: [], contentHash: 'a'.repeat(64),
    baseAgreementVersionId: null,
    project: { activeAgreementVersionId: null, members: [{ userId: 'member' }] },
  });

  test('rejects member approval with different content hash', async () => {
    const tx = { agreementVersion: { findUnique: async () => row() } };
    await expect(createPrismaAgreementRepository(transactionDatabase(tx)).approve({
      versionId: invitationId, userId: 'member', contentHash: 'b'.repeat(64), now,
    })).rejects.toMatchObject({ status: 409, code: 'CONTENT_HASH_MISMATCH' });
  });

  test('rejects approval by account outside project', async () => {
    const tx = { agreementVersion: { findUnique: async () => row() } };
    await expect(createPrismaAgreementRepository(transactionDatabase(tx)).approve({
      versionId: invitationId, userId: 'outsider', contentHash: 'a'.repeat(64), now,
    })).rejects.toMatchObject({ status: 404, code: 'AGREEMENT_NOT_FOUND' });
  });

  test('rejects approval based on an obsolete active agreement version', async () => {
    const version = row();
    version.project.activeAgreementVersionId = 'newer-version';
    const tx = { agreementVersion: { findUnique: async () => version } };
    await expect(createPrismaAgreementRepository(transactionDatabase(tx)).approve({
      versionId: invitationId, userId: 'member', contentHash: 'a'.repeat(64), now,
    })).rejects.toMatchObject({ status: 409, code: 'VERSION_CONFLICT' });
  });
});

function multipartRequest(contents) {
  const boundary = 'accordia-review-boundary';
  const chunks = [];
  for (const content of contents) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`));
    chunks.push(content, Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const request = Readable.from(chunks);
  request.headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
  return request;
}

async function withStorage(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'accordia-review-'));
  try { await callback(createFileStorage(directory)); }
  finally { await rm(directory, { recursive: true, force: true }); }
}

const pdf = (size = 16) => {
  const content = Buffer.alloc(size);
  content.write('%PDF-1.7');
  return content;
};

describe('review: real multipart parser with temporary storage', () => {
  test('allows five small PDF-signature files', () => withStorage(async (storage) => {
    const result = await storage.parse(multipartRequest(Array.from({ length: 5 }, () => pdf())));
    expect(result).toHaveLength(5);
  }));

  test('rejects sixth file', () => withStorage(async (storage) => {
    await expect(storage.parse(multipartRequest(Array.from({ length: 6 }, () => pdf()))))
      .rejects.toMatchObject({ status: 422, code: 'TOO_MANY_FILES' });
  }));

  test('rejects file above 10 MiB', () => withStorage(async (storage) => {
    await expect(storage.parse(multipartRequest([pdf(MAX_FILE_SIZE + 1)])))
      .rejects.toMatchObject({ status: 413, code: 'FILE_TOO_LARGE' });
  }));

  test('rejects fake PDF payload', () => withStorage(async (storage) => {
    await expect(storage.parse(multipartRequest([Buffer.from('not a PDF')])) )
      .rejects.toMatchObject({ status: 422, code: 'INVALID_FILE_TYPE' });
  }));

  test('BUG-04 fixed: accepts file exactly at 10 MiB maximum', () => withStorage(async (storage) => {
    const files = await storage.parse(multipartRequest([pdf(MAX_FILE_SIZE)]));
    expect(files[0].size).toBe(MAX_FILE_SIZE);
  }));
});
