export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  headline?: string;
  targetRole?: string;
  yearsExperience?: number;
  bio?: string;
  primarySkills?: string[];
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfileUpdatePayload {
  fullName: string;
  headline?: string;
  targetRole?: string;
  yearsExperience?: number;
  bio?: string;
  primarySkills?: string[];
}
