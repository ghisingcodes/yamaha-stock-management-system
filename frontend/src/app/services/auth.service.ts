import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {jwtDecode} from 'jwt-decode';

export interface User {
  username: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  private token = signal<string | null>(localStorage.getItem('token'));
  private currentUser = signal<User | null>(null);

  constructor() {
    const token = this.token();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUser.set({ username: decoded.username, role: decoded.role });
      } catch {
        this.logout();
      }
    }
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        this.token.set(res.access_token);
        const decoded: any = jwtDecode(res.access_token);
        this.currentUser.set({ username: decoded.username, role: decoded.role });
      })
    );
  }

  register(username: string, password: string, role: 'user' | 'admin' = 'user') {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { username, password, role });
  }

  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
    this.currentUser.set(null);
  }

  getToken() { return this.token(); }
  isLoggedIn() { return !!this.token(); }
  isAdmin() { return this.currentUser()?.role === 'admin'; }
  getCurrentUser() { return this.currentUser(); }
}
