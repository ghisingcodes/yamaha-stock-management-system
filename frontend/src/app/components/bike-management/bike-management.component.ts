import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { PhotoUploadComponent } from '../photo-upload/photo-upload.component';
import { animate, style, transition, trigger } from '@angular/animations';

interface Bike {
  _id: string;
  name: string;
  model?: string;
  year?: number;
  price?: number;
  description?: string;
  photos?: string[];
}

@Component({
  selector: 'app-bike-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    HeaderComponent,
    PhotoUploadComponent
  ],
  templateUrl: './bike-management.component.html',
  styleUrls: ['./bike-management.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class BikeManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private apiUrl = `${environment.apiUrl}/bikes`;
  readonly backendUrl = environment.apiUrl;

  // State signals
  bikes = signal<Bike[]>([]);
  form: FormGroup;
  isEditing = signal(false);
  editingId = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  selectedPhotos = signal<File[]>([]);

  constructor() {
    // Initialize reactive form with validators
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      model: ['', [Validators.maxLength(50)]],
      year: [null, [Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      price: [null, [Validators.min(0)]],
      description: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadBikes();
  }

  // ── Load all bikes ────────────────────────────────────────────────────────
  loadBikes(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<Bike[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.bikes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load bikes. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }

    onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/no-photo.jpg'; // Place a default image in src/assets
    img.onerror = null; // Prevent infinite loop if fallback also fails
  }

  getExistingPhotos(): string[] {
    if(!this.isEditing() || !this.editingId()){
      return []
    }

    const currentBike = this.bikes().find(b=> b._id === this.editingId());
    return currentBike?.photos || []
  }

  onPhotosSelected(files: File[]): void {
    this.selectedPhotos.set(files);
  }

  saveBike(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();

    // Append ONLY non-empty form fields as strings
    const formValue = this.form.value;
    if (formValue.name) formData.append('name', formValue.name);
    if (formValue.model) formData.append('model', formValue.model);
    if (formValue.year) formData.append('year', formValue.year.toString());
    if (formValue.price) formData.append('price', formValue.price.toString());
    if (formValue.description) formData.append('description', formValue.description);

    // Append photos (key point: multiple files with SAME field name 'photos')
    this.selectedPhotos().forEach(file => {
      formData.append('photos', file); // Backend expects 'photos' field
    });

    console.log('Sending FormData:'); // Debug
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const request = this.editingId()
      ? this.http.patch(`${this.apiUrl}/${this.editingId()}`, formData)
      : this.http.post(this.apiUrl, formData);

    request.subscribe({
      next: (response) => {
        console.log('Success:', response);
        this.resetForm();
        this.loadBikes();
      },
      error: (err) => {
        console.error('Full error:', err);
        this.errorMessage.set(err.error?.message || `HTTP ${err.status}: ${err.statusText}`);
        this.isLoading.set(false);
      }
    });
  }

  // ── Edit existing bike ───────────────────────────────────────────────────
  editBike(bike: Bike): void {
    this.form.patchValue({
      name: bike.name,
      model: bike.model || '',
      year: bike.year || null,
      price: bike.price || null,
      description: bike.description || ''
    });

    this.editingId.set(bike._id);
    this.isEditing.set(true);
    this.selectedPhotos.set([]); // Reset new photo uploads
  }

  // ── Delete bike ──────────────────────────────────────────────────────────
  deleteBike(id: string): void {
    if (!confirm('Are you sure you want to permanently delete this bike?')) {
      return;
    }

    this.isLoading.set(true);

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => this.loadBikes(),
      error: () => {
        this.errorMessage.set('Failed to delete bike');
        this.isLoading.set(false);
      }
    });
  }

  // ── Reset form to initial state ──────────────────────────────────────────
  resetForm(): void {
    this.form.reset();
    this.editingId.set(null);
    this.isEditing.set(false);
    this.selectedPhotos.set([]);
  }

  // Form control getters for template validation messages
  get name() { return this.form.get('name'); }
  get year() { return this.form.get('year'); }
  get price() { return this.form.get('price'); }
}
