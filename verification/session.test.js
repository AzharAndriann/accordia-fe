import { expect, test, mock } from 'bun:test';
const storage = new Map();
mock.module('react-native', () => ({ Platform: { OS: 'ios' } }));
mock.module('expo-secure-store', () => ({
  getItemAsync: async (key) => storage.get(key) ?? null,
  setItemAsync: async (key, value) => { storage.set(key, value); },
  deleteItemAsync: async (key) => { storage.delete(key); },
}));
const { persistSession, clearSession, getCurrentUser, getSessionEpoch, restoreSession, updateSessionUser } = await import('../src/lib/session.ts');
const { queryClient } = await import('../src/lib/query-client.ts');
const session = (id) => ({ accessToken: 'test-access', refreshToken: 'test-refresh', expiresAt: Date.now() + 60000, user: { id, email: `${id}@example.com`, name: id, role: 'CLIENT', needsConsent: true } });

test('automatic session clearing discards cached private data', async () => {
  await persistSession(session('A'));
  queryClient.setQueryData(['projects', 'list'], ['private-A']);
  const previous = getSessionEpoch();
  await clearSession();
  expect(queryClient.getQueryData(['projects', 'list'])).toBeUndefined();
  expect(getCurrentUser()).toBeNull();
  expect(getSessionEpoch()).toBeGreaterThan(previous);
  await persistSession(session('B'));
  expect(queryClient.getQueryData(['projects', 'list'])).toBeUndefined();
  await clearSession();
});
test('updating consent survives native session restoration', async () => {
  await persistSession(session('A'));
  await updateSessionUser({ ...getCurrentUser(), needsConsent: false });
  await restoreSession();
  expect(getCurrentUser().needsConsent).toBe(false);
  await clearSession();
});
test('concurrent save and logout cannot leave persisted credentials', async () => {
  await Promise.all([persistSession(session('A')), clearSession()]);
  expect(storage.has('accordia.session')).toBe(false);
  expect(storage.has('accordia.refresh-token')).toBe(false);
  expect(getCurrentUser()).toBeNull();
});
