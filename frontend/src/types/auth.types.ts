export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  email_notifications: boolean;
  in_app_notifications: boolean;
  last_login_at: string | null;
  role: {
    id: number;
    name: string;
    slug: 'super_admin' | 'admin' | 'manager' | 'consultant';
  } | null;
  permissions: string[];
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
