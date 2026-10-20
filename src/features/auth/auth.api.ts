import { apiRequest } from '@/lib/api';
import { setAccessToken, setRefreshToken } from '@/lib/session';
import type { ApiSuccess } from '@/types/api';

import type { LoginForm, RegisterForm } from './auth.schema';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export function login(input: LoginForm) {
  return apiRequest<ApiSuccess<AuthResult>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterForm) {
  const { confirmPassword: _confirmPassword, ...payload } = input;

  return apiRequest<ApiSuccess<AuthResult>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function saveAuthSession(result: AuthResult) {
  setAccessToken(result.accessToken);
  await setRefreshToken(result.refreshToken);
}
