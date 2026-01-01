import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../header/header.component';

interface Bike {
  _id: string;
  name: string;
  model?: string;
  year?: number;
  price?: number;
  description?: string;
}

@Component({
  selector: 'app-bike-management',
  standalone: true,
  imports: [FormsModule, HeaderComponent],
  templateUrl: './bike-management.component.html',
  styleUrl: './bike-management.component.css'
})
export class BikeManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bikes`;

  bikes = signal<Bike[]>([]);
  formData = signal<Partial<Bike>>({ name: '', model: '', year: 0, price: 0, description: '' });
  editingId = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadBikes();
  }

  loadBikes() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.http.get<Bike[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.bikes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load bikes');
        this.isLoading.set(false);
      }
    });
  }

  saveBike() {
    const bike = this.formData();
    if (!bike.name?.trim()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request = this.editingId()
      ? this.http.patch(`${this.apiUrl}/${this.editingId()}`, bike)
      : this.http.post(this.apiUrl, bike);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.loadBikes();
      },
      error: () => {
        this.errorMessage.set('Operation failed');
        this.isLoading.set(false);
      }
    });
  }

  editBike(bike: Bike) {
    this.formData.set({ ...bike });
    this.editingId.set(bike._id);
  }

  deleteBike(id: string) {
    if (!confirm('Delete this bike permanently?')) return;

    this.isLoading.set(true);
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => this.loadBikes(),
      error: () => {
        this.errorMessage.set('Delete failed');
        this.isLoading.set(false);
      }
    });
  }

  resetForm() {
    this.formData.set({ name: '', model: '', year: 0, price: 0, description: '' });
    this.editingId.set(null);
  }
}
