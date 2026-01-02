import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { animate, style, transition, trigger } from '@angular/animations';

interface Bike {
  _id: string;
  name: string;
  model?: string;
  year?: number;
  price?: number;
  description?: string;
  photos?: string[]; // array of image URLs from backend
}

@Component({
  selector: 'app-bike-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './bike-list.component.html',
  styleUrls: ['./bike-list.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class BikeListComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bikes`;
  readonly backendUrl = environment.apiUrl;

  bikes = signal<Bike[]>([]);
  isLoading = signal(true);
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
      error: () => {
        this.errorMessage.set('Failed to load bikes. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }
}
