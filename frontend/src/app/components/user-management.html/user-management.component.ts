import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { environment } from '../../../environments/environment';

interface User {
  _id: string;
  username: string;
  role: 'user' | 'admin';
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  createForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['user', Validators.required]
  });

  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.http.get<User[]>(`${environment.apiUrl}/auth/admin/users`).subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users');
        this.isLoading.set(false);
      }
    });
  }

  createUser() {
    if (this.createForm.invalid) return;

    this.isLoading.set(true);
    this.http.post(`${environment.apiUrl}/auth/admin/create-user`, this.createForm.value).subscribe({
      next: () => {
        this.loadUsers();
        this.createForm.reset({ role: 'user' });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create user');
        this.isLoading.set(false);
      }
    });
  }

  changeRole(userId: string, role: 'user' | 'admin') {
    this.http.patch(`${environment.apiUrl}/auth/admin/users/${userId}/role`, { role }).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Failed to change role')
    });
  }
}
