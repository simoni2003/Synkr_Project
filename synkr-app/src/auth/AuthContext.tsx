import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setSessionExpiredHandler } from '../services/api';
import { authService } from '../services/auth.service';
import { tokenStore } from '../services/tokenStore';
import { usersService } from '../services/users.service';
import type { AuthSession, SkillSelection, UserProfile } from '../types/api';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: Status;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  saveSkills: (teach: SkillSelection[], learn: SkillSelection[]) => Promise<void>;
  updateProfile: (patch: { name?: string; headline?: string; city?: string; bio?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);

  const applySession = useCallback(async (s: AuthSession) => {
    await tokenStore.set(s.accessToken, s.refreshToken);
    setUser(s.user);
    setStatus('signedIn');
  }, []);

  const clearSession = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Ao abrir a app: se houver sessão guardada, carrega o perfil real do backend
  useEffect(() => {
    (async () => {
      const refresh = await tokenStore.getRefresh();
      if (!refresh) {
        setStatus('signedOut');
        return;
      }
      try {
        setUser(await usersService.me());
        setStatus('signedIn');
      } catch {
        // sessão inválida ou servidor inacessível: pede novo login (os tokens só são apagados se forem inválidos)
        setStatus('signedOut');
      }
    })();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // Funções estáveis (não mudam entre renders), para poderem ser usadas em dependências de efeitos
  const signIn = useCallback(
    async (email: string, password: string) => applySession(await authService.login({ email, password })),
    [applySession],
  );
  const register = useCallback(async (name: string, email: string, password: string) => {
    await authService.register({ name, email, password });
  }, []);
  const verifyEmail = useCallback(
    async (email: string, code: string) => applySession(await authService.verifyEmail({ email, code })),
    [applySession],
  );
  const resendCode = useCallback(async (email: string) => {
    await authService.resendCode(email);
  }, []);
  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);
  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await authService.resetPassword({ email, code, newPassword });
  }, []);
  const saveSkills = useCallback(async (teach: SkillSelection[], learn: SkillSelection[]) => {
    setUser(await usersService.setSkills({ teach, learn }));
  }, []);
  const updateProfile = useCallback(async (patch: { name?: string; headline?: string; city?: string; bio?: string }) => {
    setUser(await usersService.updateMe(patch));
  }, []);
  const refreshUser = useCallback(async () => {
    setUser(await usersService.me());
  }, []);
  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // mesmo sem rede, termina a sessão localmente
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status, user, signIn, register, verifyEmail, resendCode, forgotPassword,
      resetPassword, saveSkills, updateProfile, refreshUser, signOut,
    }),
    [status, user, signIn, register, verifyEmail, resendCode, forgotPassword, resetPassword, saveSkills, updateProfile, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
