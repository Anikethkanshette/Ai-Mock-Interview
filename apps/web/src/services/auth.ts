import type { LoginPayload, ProfileUpdatePayload, RegisterPayload, UserProfile } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const SESSION_KEY = 'agentic_intervier_session';

type SessionState = {
  token: string;
  user: UserProfile;
};

function readSessionState(): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

function writeSessionState(state: SessionState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

function clearSessionState() {
  localStorage.removeItem(SESSION_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? 'Request failed');
  }

  return data as T;
}

function authHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`
  };
}

export function getCurrentSessionUser(): UserProfile | null {
  return readSessionState()?.user ?? null;
}

export async function hydrateCurrentSessionUser(): Promise<UserProfile | null> {
  const state = readSessionState();

  if (!state?.token) {
    return null;
  }

  try {
    const response = await request<{ user: UserProfile }>('/auth/me', {
      method: 'GET',
      headers: authHeader(state.token)
    });

    writeSessionState({ token: state.token, user: response.user });
    return response.user;
  } catch {
    clearSessionState();
    return null;
  }
}

export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  const response = await request<{ token: string; user: UserProfile }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  writeSessionState({ token: response.token, user: response.user });
  return response.user;
}

export async function loginUser(payload: LoginPayload): Promise<UserProfile> {
  const response = await request<{ token: string; user: UserProfile }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  writeSessionState({ token: response.token, user: response.user });
  return response.user;
}

export async function updateCurrentUserProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  const state = readSessionState();

  if (!state?.token) {
    throw new Error('No active session user found.');
  }

  const response = await request<{ user: UserProfile }>('/auth/profile', {
    method: 'PATCH',
    headers: authHeader(state.token),
    body: JSON.stringify(payload)
  });

  writeSessionState({ token: state.token, user: response.user });
  return response.user;
}

export async function logoutUser() {
  const state = readSessionState();

  if (state?.token) {
    try {
      await request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
        headers: authHeader(state.token)
      });
    } catch {
      // Ignore logout network errors and clear session locally.
    }
  }

  clearSessionState();
}
