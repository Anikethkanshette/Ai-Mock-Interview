import type { Request, Response } from 'express';
import {
  getAuthUserFromToken,
  loginAuthUser,
  logoutAuthSession,
  registerAuthUser,
  updateAuthUserProfile
} from '../services/auth.service.js';
import type { LoginAuthRequest, ProfileUpdateRequest, RegisterAuthRequest } from '../types/auth.types.js';

function getBearerToken(req: Request): string | null {
  const header = req.header('authorization');

  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  return header.slice(7).trim() || null;
}

export function registerAuthController(req: Request, res: Response) {
  const body = req.body as Partial<RegisterAuthRequest>;

  if (!body.fullName || !body.email || !body.password) {
    return res.status(400).json({ message: 'fullName, email, and password are required.' });
  }

  try {
    const response = registerAuthUser({
      fullName: body.fullName,
      email: body.email,
      password: body.password
    });

    return res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return res.status(400).json({ message });
  }
}

export function loginAuthController(req: Request, res: Response) {
  const body = req.body as Partial<LoginAuthRequest>;

  if (!body.email || !body.password) {
    return res.status(400).json({ message: 'email and password are required.' });
  }

  try {
    const response = loginAuthUser({
      email: body.email,
      password: body.password
    });

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(401).json({ message });
  }
}

export function meAuthController(req: Request, res: Response) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Bearer token is required.' });
  }

  try {
    const user = getAuthUserFromToken(token);
    return res.status(200).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve session';
    return res.status(401).json({ message });
  }
}

export function updateProfileAuthController(req: Request, res: Response) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Bearer token is required.' });
  }

  const body = req.body as Partial<ProfileUpdateRequest>;

  if (!body.fullName) {
    return res.status(400).json({ message: 'fullName is required.' });
  }

  try {
    const user = updateAuthUserProfile(token, {
      fullName: body.fullName,
      headline: body.headline,
      targetRole: body.targetRole,
      yearsExperience: body.yearsExperience,
      bio: body.bio,
      primarySkills: body.primarySkills
    });

    return res.status(200).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return res.status(401).json({ message });
  }
}

export function logoutAuthController(req: Request, res: Response) {
  const token = getBearerToken(req);

  if (token) {
    logoutAuthSession(token);
  }

  return res.status(200).json({ success: true });
}
