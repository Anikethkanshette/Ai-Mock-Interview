import type { LoginPayload, ProfileUpdatePayload, RegisterPayload, UserProfile } from '../types/auth';

const USERS_KEY = 'aimi_users';
const SESSION_KEY = 'aimi_session';

interface StoredUser extends UserProfile {
  password: string;
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function persistSession(user: UserProfile) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getCurrentSessionUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  const users = readUsers();
  const email = payload.email.toLowerCase().trim();

  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error('User with this email already exists.');
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    fullName: payload.fullName.trim(),
    email,
    password: payload.password,
    createdAt: new Date().toISOString(),
    headline: 'Software Engineer',
    targetRole: 'backend',
    bio: '',
    primarySkills: []
  };

  users.push(user);
  writeUsers(users);

  const { password: _password, ...profile } = user;
  persistSession(profile);
  return profile;
}

export async function loginUser(payload: LoginPayload): Promise<UserProfile> {
  const users = readUsers();
  const email = payload.email.toLowerCase().trim();
  const matchedUser = users.find((user) => user.email.toLowerCase() === email);

  if (!matchedUser || matchedUser.password !== payload.password) {
    throw new Error('Invalid email or password.');
  }

  const { password: _password, ...profile } = matchedUser;
  persistSession(profile);
  return profile;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateCurrentUserProfile(payload: ProfileUpdatePayload): UserProfile {
  const current = getCurrentSessionUser();

  if (!current) {
    throw new Error('No active session user found.');
  }

  const users = readUsers();
  const index = users.findIndex((user) => user.id === current.id);

  if (index < 0) {
    throw new Error('User record not found.');
  }

  const updated: StoredUser = {
    ...users[index],
    fullName: payload.fullName.trim(),
    headline: payload.headline?.trim() || undefined,
    targetRole: payload.targetRole?.trim() || undefined,
    yearsExperience: typeof payload.yearsExperience === 'number' ? payload.yearsExperience : undefined,
    bio: payload.bio?.trim() || undefined,
    primarySkills: payload.primarySkills?.map((skill) => skill.trim()).filter(Boolean) ?? []
  };

  users[index] = updated;
  writeUsers(users);

  const { password: _password, ...profile } = updated;
  persistSession(profile);
  return profile;
}
