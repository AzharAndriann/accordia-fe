import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'accordia.refresh-token';
let accessToken: string | null = null;
let webRefreshToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
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
  setAccessToken(null);
  await setRefreshToken(null);
}
