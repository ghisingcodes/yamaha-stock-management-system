// src/app/components/bike-list/bike-list.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../header/header.component'; // Keep this

interface Bike {
  _id: string;
  name: string;
  model?: string;
  year?: number;
  price?: number;
  description?: string;
  parts?: any[];
}

@Component({
  selector: 'app-bike-list',
  standalone: true,
  imports: [HeaderComponent], // ← Keep it here
  templateUrl: './bike-list.component.html',
  styleUrl: './bike-list.component.css'
})
export class BikeListComponent implements OnInit {
  private http = inject(HttpClient);
  bikes = signal<Bike[]>([]);

  ngOnInit() {
    this.http.get<Bike[]>(`${environment.apiUrl}/bikes`)
      .subscribe({
        next: (data) => this.bikes.set(data),
        error: () => console.error('Failed to load bikes')
      });
  }
}
