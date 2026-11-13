import Constants from 'expo-constants';

// Expo inlines these public build-time variables; this declaration avoids adding Node types to the mobile app.
declare const process: { env: Record<string, string | undefined> };

/** Small fetch wrapper. Keeping transport here makes it easy to replace REST with another adapter. */
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const defaultApiUrl = expoHost ? `http://${expoHost}:4000/api` : 'http://localhost:4000/api';
const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || defaultApiUrl;
let token: string | null = null;
export const setAuthToken = (value: string | null) => { token = value; };
export const getAuthToken = () => token;
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message ?? `Request failed (${response.status})`);
  return payload.data as T;
}
export const apiBaseUrl = API_URL;
