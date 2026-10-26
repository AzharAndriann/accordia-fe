import type { ApiErrorBody, ApiSuccess } from '@/types/api';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSessionSnapshot,
  persistSession,
  type CurrentUser,
} from '@/lib/session';

type RefreshedSession = {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

let refreshPromise: Promise<string | null> | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configuredUrl) {
    throw new ApiError(0, 'API_URL_MISSING', 'EXPO_PUBLIC_API_URL belum diisi');
  }
  return configuredUrl.replace(/\/$/, '');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, headers, ...requestOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && requestOptions.body instanceof FormData;
  let requestToken = accessToken;
  if (
    requestToken
    && path !== '/auth/refresh'
    && (getSessionSnapshot().expiresAt ?? 0) <= Date.now()
  ) {
    requestToken = (await refreshAccessToken()) ?? undefined;
  }
  const send = (token?: string) => fetch(`${getApiBaseUrl()}${path}`, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...(requestOptions.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  let response = await send(requestToken);
  if (response.status === 401 && requestToken && path !== '/auth/refresh') {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) response = await send(refreshedToken);
  }
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | T | null;
  if (!response.ok) {
    const apiError = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null;
    throw new ApiError(response.status, apiError?.code ?? 'API_ERROR', apiError?.message ?? 'Request gagal');
  }
  return payload as T;
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearSession();
      return null;
    }
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const payload = await response.json().catch(() => null) as
        | ApiSuccess<RefreshedSession>
        | ApiErrorBody
        | null;
      if (!response.ok || !payload || !('data' in payload)) {
        await clearSession();
        return null;
      }
      await persistSession({
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
        expiresAt: Date.now() + payload.data.expiresIn * 1_000,
        user: payload.data.user,
      });
      return payload.data.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export function authenticatedRequest<T>(path: string, options?: RequestInit) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan masuk kembali untuk melanjutkan');
  }
  return apiRequest<T>(path, { ...options, accessToken });
}

export function checkHealth() {
  return apiRequest<ApiSuccess<{ status: string }>>('/health');
}
