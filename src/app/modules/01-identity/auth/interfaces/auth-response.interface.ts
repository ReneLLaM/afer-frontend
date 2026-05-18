import { User } from './user.interface';

// ─── Lo que el backend devuelve en login, register, check-status ─────
export interface AuthResponse {
  accessToken: string;
  expiresIn:   number;
  user:        User;
}

// ─── DTOs que el frontend envía al backend ───────────────────────────
export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email:    string;
  password: string;
  phone?:   string;
  gender?:  string;
}
