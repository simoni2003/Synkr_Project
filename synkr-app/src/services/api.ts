import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config';
import type { AuthSession } from '../types/api';
import { tokenStore } from './tokenStore';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

api.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Renova o access token (uma só vez, mesmo com vários pedidos a falhar ao mesmo tempo)
let refreshing: Promise<string | null> | null = null;
async function refreshTokens(): Promise<string | null> {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    // axios "puro" (sem interceptors) para não entrar em ciclo
    const { data } = await axios.post<AuthSession>(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 15000 });
    await tokenStore.set(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? refreshTokens().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      await tokenStore.clear();
      onSessionExpired?.();
    }
    return Promise.reject(error);
  },
);

/** Mensagem de erro legível para mostrar ao utilizador. */
export function apiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) {
      return 'Não foi possível ligar ao servidor. Confirma que o backend está a correr e que o EXPO_PUBLIC_API_URL está certo.';
    }
    if (e.response.status === 429) return 'Demasiados pedidos. Espera um minuto e tenta de novo.';
    const m = (e.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(m) && m.length) return m[0];
    if (typeof m === 'string') return m;
  }
  return 'Ocorreu um erro inesperado. Tenta novamente.';
}

/** O login devolve 403 + code EMAIL_NOT_VERIFIED quando o e-mail ainda não foi confirmado. */
export function isEmailNotVerified(e: unknown): boolean {
  return (
    axios.isAxiosError(e) &&
    e.response?.status === 403 &&
    (e.response.data as { code?: string } | undefined)?.code === 'EMAIL_NOT_VERIFIED'
  );
}
