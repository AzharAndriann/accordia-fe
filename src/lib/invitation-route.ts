import type { Href } from 'expo-router';
export function validInvitationId(value: unknown): string | null {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export function invitationIdFromInput(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const input = value.trim();
  const directId = validInvitationId(input);
  if (directId) return directId;

  const pathId = input.match(/(?:^|\/)invitations\/([0-9a-f-]{36})(?=$|[/?#\s])/i)?.[1];
  return validInvitationId(pathId);
}

export function postAuthRoute(value: unknown, needsConsent?: boolean): Href {
  const id = validInvitationId(value);
  if (needsConsent !== false) return { pathname: '/consent', params: id ? { invitationId: id } : {} } as Href;
  return id ? `/invitations/${id}` as Href : '/(app)/projects';
}
