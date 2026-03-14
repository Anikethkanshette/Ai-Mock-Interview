import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type {
  AuthUserProfile,
  LoginAuthRequest,
  ProfileUpdateRequest,
  RegisterAuthRequest
} from '../types/auth.types.js';

interface StoredAuthUser extends AuthUserProfile {
  passwordHash: string;
  passwordSalt: string;
}

interface AuthSession {
  token: string;
  userId: string;
  createdAt: string;
}

const usersById = new Map<string, StoredAuthUser>();
const usersByEmail = new Map<string, string>();
const sessionsByToken = new Map<string, AuthSession>();

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function toProfile(user: StoredAuthUser): AuthUserProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
    headline: user.headline,
    targetRole: user.targetRole,
    yearsExperience: user.yearsExperience,
    bio: user.bio,
    primarySkills: user.primarySkills
  };
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function registerAuthUser(payload: RegisterAuthRequest): { token: string; user: AuthUserProfile } {
  const email = normalizeEmail(payload.email);

  if (usersByEmail.has(email)) {
    throw new Error('User with this email already exists.');
  }

  const salt = randomBytes(16).toString('hex');
  const user: StoredAuthUser = {
    id: randomUUID(),
    fullName: payload.fullName.trim(),
    email,
    passwordHash: hashPassword(payload.password, salt),
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    headline: 'Software Engineer',
    targetRole: 'backend',
    bio: '',
    primarySkills: []
  };

  usersById.set(user.id, user);
  usersByEmail.set(email, user.id);

  const token = randomBytes(24).toString('hex');
  sessionsByToken.set(token, {
    token,
    userId: user.id,
    createdAt: new Date().toISOString()
  });

  return { token, user: toProfile(user) };
}

export function loginAuthUser(payload: LoginAuthRequest): { token: string; user: AuthUserProfile } {
  const email = normalizeEmail(payload.email);
  const userId = usersByEmail.get(email);

  if (!userId) {
    throw new Error('Invalid email or password.');
  }

  const user = usersById.get(userId);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const hash = hashPassword(payload.password, user.passwordSalt);
  if (hash !== user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const token = randomBytes(24).toString('hex');
  sessionsByToken.set(token, {
    token,
    userId: user.id,
    createdAt: new Date().toISOString()
  });

  return { token, user: toProfile(user) };
}

export function getAuthUserFromToken(token: string): AuthUserProfile {
  const session = sessionsByToken.get(token);

  if (!session) {
    throw new Error('Invalid or expired session token.');
  }

  const user = usersById.get(session.userId);
  if (!user) {
    throw new Error('User not found for session token.');
  }

  return toProfile(user);
}

export function updateAuthUserProfile(token: string, payload: ProfileUpdateRequest): AuthUserProfile {
  const session = sessionsByToken.get(token);

  if (!session) {
    throw new Error('Invalid or expired session token.');
  }

  const user = usersById.get(session.userId);

  if (!user) {
    throw new Error('User not found for session token.');
  }

  user.fullName = payload.fullName.trim();
  user.headline = payload.headline?.trim() || undefined;
  user.targetRole = payload.targetRole?.trim() || undefined;
  user.yearsExperience = typeof payload.yearsExperience === 'number' ? payload.yearsExperience : undefined;
  user.bio = payload.bio?.trim() || undefined;
  user.primarySkills = payload.primarySkills?.map((skill) => skill.trim()).filter(Boolean) ?? [];

  usersById.set(user.id, user);

  return toProfile(user);
}

export function logoutAuthSession(token: string) {
  sessionsByToken.delete(token);
}
