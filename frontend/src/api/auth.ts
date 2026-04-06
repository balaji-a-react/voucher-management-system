import api from './axios';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  role: 'EMPLOYEE' | 'ADMIN'
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', { name, email, password, role });
  return response.data;
};
