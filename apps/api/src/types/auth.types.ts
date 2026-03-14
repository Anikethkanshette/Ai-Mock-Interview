export interface AuthUserProfile {
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

export interface RegisterAuthRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginAuthRequest {
  email: string;
  password: string;
}

export interface ProfileUpdateRequest {
  fullName: string;
  headline?: string;
  targetRole?: string;
  yearsExperience?: number;
  bio?: string;
  primarySkills?: string[];
}
