import { AuthSession } from "@/lib/common.types";

const AUTH_STORAGE_KEY = 'playbook:auth';

export const persistAuthSession = (session: AuthSession) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const readAuthSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export default AUTH_STORAGE_KEY;
