import { apiClient } from './client';
import { AuthResponse, LoginPayload, SignupPayload, User } from '../types/auth.types';

export const signupRequest = async (payload: SignupPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/signup', payload);
  return data;
};

export const loginRequest = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const getMeRequest = async (): Promise<{ user: User }> => {
  const { data } = await apiClient.get<{ user: User }>('/auth/me');
  return data;
};

export const logoutRequest = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/logout');
  return data;
};
