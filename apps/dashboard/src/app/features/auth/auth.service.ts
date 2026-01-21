import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/api.config';
import { authStorage } from '../../core/auth.storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string }>(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
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
}
