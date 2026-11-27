import { Request } from 'express';

export interface AuthTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface SignupInput {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

export interface LoginInput {
  email?: unknown;
  password?: unknown;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}
