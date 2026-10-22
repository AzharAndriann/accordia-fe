import type { ApiErrorBody, ApiSuccess } from '@/types/api';
import { getAccessToken } from '@/lib/session';

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
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(requestOptions.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | T | null;
  if (!response.ok) {
    const apiError = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null;
    throw new ApiError(response.status, apiError?.code ?? 'API_ERROR', apiError?.message ?? 'Request gagal');
  }
  return payload as T;
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
