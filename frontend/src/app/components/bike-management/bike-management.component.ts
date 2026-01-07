import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../header/header.component';

interface Bike {
  _id?: string;
  name: string;
  model?: string;
  year?: number;
  price?: number;
  description?: string;
  photos?: string[];           // stored paths from backend
  stockQuantity?: number;
  selected?: boolean;
}

@Component({
  selector: 'app-bike-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './bike-management.component.html',
  styleUrl: './bike-management.component.css'
})
export class BikeManagementComponent {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bikes`;

  // Data
  bikes = signal<Bike[]>([]);
  filteredBikes = signal<Bike[]>([]);
  searchTerm = signal<string>('');

  // Pagination & Sorting
  page = signal(1);
  pageSize = signal(10);
  sortColumn = signal<keyof Bike>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  selectedIds = signal<Set<string>>(new Set());

  // Modals & State
  showAddEditModal = signal(false);
  showDetailModal = signal(false);
  showQuickPreview = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  currentBike = signal<Partial<Bike>>({ name: '', photos: [] });
  previewBike = signal<Bike | null>(null);

  // Photo handling
  selectedFiles = signal<File[]>([]);
  photoPreviews = signal<string[]>([]);

  // Loading & Errors
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Hover timer
  private hoverTimer: any = null;

  // Stats
  totalBikes = computed(() => this.filteredBikes().length);
  totalValue = computed(() => this.filteredBikes().reduce((sum, b) => sum + (b.price || 0), 0));
  lowStockCount = computed(() => this.filteredBikes().filter(b => (b.stockQuantity || 0) < 5).length);

  constructor() {
    effect(() => this.loadBikes());
    effect(() => this.applyFiltersAndSorting());
  }

  loadBikes() {
    this.isLoading.set(true);
    this.http.get<Bike[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.bikes.set(data.map(b => ({ ...b, selected: false })));
        this.applyFiltersAndSorting();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load bikes');
        this.isLoading.set(false);
      }
    });
  }

  applyFiltersAndSorting() {
    let result = [...this.bikes()];
    const term = this.searchTerm().toLowerCase().trim();

    if (term) {
      result = result.filter(b =>
        b.name.toLowerCase().includes(term) ||
        (b.model?.toLowerCase().includes(term) ?? false) ||
        (b.description?.toLowerCase().includes(term) ?? false)
      );
    }

    result.sort((a, b) => {
      const aVal = a[this.sortColumn()] ?? '';
      const bVal = b[this.sortColumn()] ?? '';
      return this.sortDirection() === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    this.filteredBikes.set(result);
  }

  get paginatedBikes() {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredBikes().slice(start, start + this.pageSize());
  }

  totalPages = computed(() => Math.ceil(this.filteredBikes().length / this.pageSize()));

  sortBy(column: keyof Bike) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.applyFiltersAndSorting();
  }

  // Selection
  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.set(checked ? new Set(this.paginatedBikes.map(b => b._id!)) : new Set());
  }

  bulkDelete() {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) return;

    if (!confirm(`Delete ${ids.length} selected bike(s)? This cannot be undone.`)) {
      return;
    }

    this.isLoading.set(true);

    // Delete one by one (simple & safe)
    const deletePromises = ids.map(id =>
      this.http.delete(`${this.apiUrl}/${id}`).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.selectedIds.set(new Set());
        this.loadBikes();
      })
      .catch(err => {
        console.error('Bulk delete failed:', err);
        alert('Some deletes failed. Please try again.');
      })
      .finally(() => this.isLoading.set(false));
  }

  toggleSelect(id: string) {
    const set = new Set(this.selectedIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selectedIds.set(set);
  }

  openAddModal() {
    console.log('Opening ADD modal'); // ← debug
    this.currentBike.set({ name: '', model: '', year: undefined, price: undefined, description: '', photos: [], stockQuantity: 0 });
    this.selectedFiles.set([]);
    this.photoPreviews.set([]);
    this.modalMode.set('add');
    this.showAddEditModal.set(true);
  }

  openEditModal(bike: Bike) {
    console.log('Opening EDIT modal for bike:', bike._id); // ← debug
    this.currentBike.set({ ...bike });
    this.selectedFiles.set([]);
    this.photoPreviews.set(bike.photos?.map(p => `${environment.apiUrl}${p}`) || []);
    this.modalMode.set('edit');
    this.showAddEditModal.set(true);
  }

  openDetailModal(bike: Bike) {
    this.currentBike.set({ ...bike });
    this.showDetailModal.set(true);
  }

  closeModals() {
    this.showAddEditModal.set(false);
    this.showDetailModal.set(false);
    this.showQuickPreview.set(false);
    this.currentBike.set({});
    this.previewBike.set(null);
    this.selectedFiles.set([]);
    this.photoPreviews.set([]);
  }

  // Photo Upload
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    this.selectedFiles.update(existing => [...existing, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.photoPreviews.update(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  removePreview(index: number) {
    this.photoPreviews.update(prev => prev.filter((_, i) => i !== index));
    this.selectedFiles.update(prev => prev.filter((_, i) => i !== index));
  }


  // In saveBike()
  saveBike() {
    const bike = this.currentBike();
    if (!bike.name) {
      alert('Name is required');
      return;
    }

    this.isLoading.set(true);

    const formData = new FormData();
    formData.append('name', bike.name);
    if (bike.model) formData.append('model', bike.model);
    if (bike.year) formData.append('year', bike.year.toString());
    if (bike.price) formData.append('price', bike.price.toString());
    if (bike.description) formData.append('description', bike.description);
    if (bike.stockQuantity !== undefined) formData.append('stockQuantity', bike.stockQuantity.toString());

    // Preserve existing photos during edit
    if (this.modalMode() === 'edit' && bike.photos?.length) {
      formData.append('existingPhotos', JSON.stringify(bike.photos));
    }

    // Add new photos
    this.selectedFiles().forEach(file => {
      formData.append('photos', file, file.name);  // ← add filename
    });

    const url = this.modalMode() === 'add' ? this.apiUrl : `${this.apiUrl}/${bike._id}`;
    const method = this.modalMode() === 'add' ? 'post' : 'patch';

    this.http[method](url, formData).subscribe({
      next: (res) => {
        console.log('Save success:', res);
        this.closeModals();
        this.loadBikes();
      },
      error: (err) => {
        console.error('Save failed:', err);
        alert('Save failed: ' + (err.error?.message || 'Unknown error'));
      },
      complete: () => this.isLoading.set(false)
    });
  }

  startHoverPreview(bike: Bike) {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      this.previewBike.set(bike);
      this.showQuickPreview.set(true);
    }, 2000);
  }

  cancelHoverPreview() {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    this.showQuickPreview.set(false);
    this.previewBike.set(null);
  }

  // In your component
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/no-photo.jpg';
  }

  getPhotoUrl(photoPath: string): string {
    if (!photoPath) return '/assets/no-photo.jpg';

    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    const normalized = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    const base = environment.apiUrl.replace(/\/$/, '');

    return `${base}${normalized}`;
  }

  getFirstPhoto(bike: Bike | null | undefined): string {
    if (!bike?.photos?.length) {
      return '/assets/no-photo.jpg';
    }

    const firstPhoto = bike.photos[0];

    // Case 1: already full URL (not recommended but handle it)
    if (firstPhoto.startsWith('http')) {
      return firstPhoto;
    }

    // Case 2: starts with /uploads/ → perfect
    // Case 3: doesn't start with / → add it
    const path = firstPhoto.startsWith('/') ? firstPhoto : `/${firstPhoto}`;

    // Remove trailing slash from apiUrl and add path
    const base = environment.apiUrl.replace(/\/$/, '');

    return `${base}${path}`;
  }
}
