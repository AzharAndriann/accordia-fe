import { authenticatedRequest , apiRequest } from '@/lib/api';
import { clearSession , persistSession } from '@/lib/session';
import type { ApiSuccess } from '@/types/api';

import type { AuthRole, LoginForm, RegisterForm } from './auth.schema';

const authRoutes = {
  login: '/auth/login',
  register: '/auth/register',
} as const;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  emailVerifiedAt: string | null;
  createdAt: string;
  needsConsent: boolean;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

type RegisterPayload = Pick<RegisterForm, 'name' | 'email' | 'role' | 'password' | 'consent'>;

export function login(input: LoginForm) {
  return apiRequest<ApiSuccess<AuthResult>>(authRoutes.login, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterForm) {
  const payload: RegisterPayload = {
    name: input.name,
    email: input.email,
    role: input.role,
    password: input.password,
    consent: input.consent,
  };

  return apiRequest<ApiSuccess<AuthResult>>(authRoutes.register, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logoutSession() {
  await authenticatedRequest('/auth/logout', { method: 'POST' });
  await clearSession();
}

export async function saveAuthSession(result: AuthResult) {
  await persistSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: Date.now() + result.expiresIn * 1_000,
    user: result.user,
  });
}
