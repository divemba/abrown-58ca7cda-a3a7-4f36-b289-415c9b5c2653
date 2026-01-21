import { jwtDecode } from 'jwt-decode';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/api.config';
import { authStorage } from '../../core/auth.storage';

type JwtPayload = { role?: string; email?: string; sub?: number; userId?: number };

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string }>(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setToken(token: string) {
    authStorage.set(token);
  }

  logout() {
    authStorage.clear();
  }

  isLoggedIn() {
    return !!authStorage.get();
  }

  getUser() {
    const token = this.getToken();
    if (!token) return null;
    const payload = jwtDecode<JwtPayload>(token);
    return {
      role: payload.role ?? '',
      email: payload.email ?? '',
      id: (payload.userId ?? payload.sub ?? 0) as number,
    };
  }

  isAdminLike() {
    const u = this.getUser();
    return u?.role === 'Owner' || u?.role === 'Admin';
  }

  isViewer() {
    return this.getUser()?.role === 'Viewer';
  }
}
