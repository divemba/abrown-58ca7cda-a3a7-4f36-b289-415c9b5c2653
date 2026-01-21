import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="login-badge">Secure Task Management System</div>
          <h1 class="login-title">Welcome back</h1>
          <p class="login-subtitle">Sign in to manage your tasks securely.</p>
        </div>

        <div class="login-form">
          <label class="login-label">Email</label>
          <input class="login-input"
                placeholder="you@example.com"
                [(ngModel)]="email" />

          <label class="login-label">Password</label>
          <input type="password"
                class="login-input"
                placeholder="••••••••"
                [(ngModel)]="password" />

          <button class="login-button"
                  (click)="onLogin()"
                  [disabled]="loading">
            <span *ngIf="!loading">Login</span>
            <span *ngIf="loading">Logging in…</span>
          </button>

          <p class="login-error" *ngIf="error">{{ error }}</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onLogin() {
    this.loading = true;
    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.setToken(res.accessToken);
        this.router.navigateByUrl('/tasks');
      },
      error: () => {
        this.error = 'Invalid credentials';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
