import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6">
      <div class="w-full max-w-md rounded-lg border p-6 shadow-sm bg-white">
        <h1 class="text-2xl font-semibold mb-4">Dashboard Login</h1>

        <label class="block text-sm mb-1">Email</label>
        <input class="w-full border rounded px-3 py-2 mb-3"
               [(ngModel)]="email" />

        <label class="block text-sm mb-1">Password</label>
        <input type="password"
               class="w-full border rounded px-3 py-2 mb-4"
               [(ngModel)]="password" />

        <button class="w-full rounded px-3 py-2 bg-black text-white disabled:opacity-60"
                (click)="onLogin()"
                [disabled]="loading">
          {{ loading ? 'Logging in…' : 'Login' }}
        </button>

        <p class="text-sm text-red-600 mt-3" *ngIf="error">{{ error }}</p>

        <div class="text-xs text-gray-500 mt-4 space-y-1">
          <div>owner@test.com</div>
          <div>admin@test.com</div>
          <div>viewer@test.com</div>
          <div>Password: <span class="font-mono">password</span></div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = 'owner@test.com';
  password = 'password';
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
