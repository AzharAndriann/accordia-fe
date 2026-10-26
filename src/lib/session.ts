import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'accordia.refresh-token';
const SESSION_KEY = 'accordia.session';
let accessToken: string | null = null;
let webRefreshToken: string | null = null;
let currentUser: CurrentUser | null = null;
let sessionExpiresAt: number | null = null;
const listeners = new Set<() => void>();

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: 'FREELANCER' | 'CLIENT';
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: CurrentUser;
};

let sessionSnapshot: {
  accessToken: string | null;
  expiresAt: number | null;
  user: CurrentUser | null;
} = {
  accessToken,
  expiresAt: sessionExpiresAt,
  user: currentUser,
};

function emitSessionChange() {
  sessionSnapshot = {
    accessToken,
    expiresAt: sessionExpiresAt,
    user: currentUser,
  };
  listeners.forEach((listener) => listener());
}

function applySession(session: StoredSession | null) {
  accessToken = session?.accessToken ?? null;
  webRefreshToken = session?.refreshToken ?? null;
  currentUser = session?.user ?? null;
  sessionExpiresAt = session?.expiresAt ?? null;
  emitSessionChange();
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  emitSessionChange();
}

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user: CurrentUser | null) {
  currentUser = user;
  emitSessionChange();
}

export function getSessionSnapshot() {
  return sessionSnapshot;
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function restoreSession() {
  if (Platform.OS === 'web') return getSessionSnapshot();
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return getSessionSnapshot();

  try {
    const stored = JSON.parse(raw) as StoredSession;
    if (!stored.accessToken || !stored.refreshToken || !stored.user) {
      await clearSession();
      return getSessionSnapshot();
    }
    applySession(stored);
  } catch {
    await clearSession();
  }
  return getSessionSnapshot();
}

export async function persistSession(session: StoredSession) {
  applySession(session);
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
  }
}

export async function getRefreshToken() {
  if (Platform.OS === 'web') return webRefreshToken;
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string | null) {
  if (Platform.OS === 'web') {
    webRefreshToken = token;
    return;
  }
  if (token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearSession() {
  applySession(null);
  if (Platform.OS !== 'web') {
    await Promise.all([
      SecureStore.deleteItemAsync(SESSION_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  }
}
