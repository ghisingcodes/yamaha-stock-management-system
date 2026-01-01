// src/app/components/part-management/part-management.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../header/header.component';

interface Part {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  compatibleBikes?: string[];
}

@Component({
  selector: 'app-part-management',
  standalone: true,
  imports: [ReactiveFormsModule, HeaderComponent],
  templateUrl: './part-management.component.html',
  styleUrl: './part-management.component.css'
})
export class PartManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private apiUrl = `${environment.apiUrl}/parts`;

  parts = signal<Part[]>([]);
  form: FormGroup;
  isEditing = signal(false);               // ← Fixed: declare the signal
  editingId = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      compatibleBikesInput: ['']
    });
  }

  ngOnInit() {
    this.loadParts();
  }

  loadParts() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<Part[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.parts.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load parts');
        this.isLoading.set(false);
      }
    });
  }

  savePart() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const partData: Partial<Part> = {
      name: rawValue.name.trim(),
      description: rawValue.description?.trim() || undefined,
      price: Number(rawValue.price),
      stockQuantity: Number(rawValue.stockQuantity),
      compatibleBikes: rawValue.compatibleBikesInput
        ? rawValue.compatibleBikesInput.split(',').map((id: string) => id.trim()).filter(Boolean)
        : undefined
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request = this.editingId()
      ? this.http.patch(`${this.apiUrl}/${this.editingId()}`, partData)
      : this.http.post(this.apiUrl, partData);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.loadParts();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to save part');
        this.isLoading.set(false);
      }
    });
  }

  editPart(part: Part) {
    this.form.patchValue({
      name: part.name,
      description: part.description || '',
      price: part.price,
      stockQuantity: part.stockQuantity,
      compatibleBikesInput: part.compatibleBikes?.join(', ') || ''
    });

    this.editingId.set(part._id);
    this.isEditing.set(true);               // ← Set when editing
  }

  deletePart(id: string) {
    if (!confirm('Delete this part permanently?')) return;

    this.isLoading.set(true);
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => this.loadParts(),
      error: () => {
        this.errorMessage.set('Delete failed');
        this.isLoading.set(false);
      }
    });
  }

  resetForm() {
    this.form.reset({
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      compatibleBikesInput: ''
    });
    this.editingId.set(null);
    this.isEditing.set(false);              // ← Reset editing state
  }

  // Getters for template validation
  get name() { return this.form.get('name'); }
  get price() { return this.form.get('price'); }
  get stockQuantity() { return this.form.get('stockQuantity'); }
}
