import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../header/header.component';

interface Transaction {
  _id: string;
  type: 'purchase' | 'sale';
  itemType: 'bike' | 'part';
  itemId: string;
  quantity: number;
  amount?: number;
  createdAt: string;
  // You can expand with populated item/user info
}

@Component({
  selector: 'app-transaction-log',
  standalone: true,
  imports: [FormsModule, CommonModule, HeaderComponent],
  templateUrl: './transaction-log.component.html',
  styleUrl: './transaction-log.component.css'
})
export class TransactionLogComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;

  transactions = signal<Transaction[]>([]);
  newTransaction = signal({
    type: 'purchase',
    itemType: 'part',
    itemId: '',
    quantity: 1,
    amount: undefined
  });
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<Transaction[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load transactions');
        this.isLoading.set(false);
      }
    });
  }

  createTransaction() {
    const tx = this.newTransaction();
    if (!tx.itemId.trim() || tx.quantity <= 0) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.post(this.apiUrl, tx).subscribe({
      next: () => {
        this.resetForm();
        this.loadTransactions();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to record transaction');
        this.isLoading.set(false);
      }
    });
  }

  resetForm() {
    this.newTransaction.set({
      type: 'purchase',
      itemType: 'part',
      itemId: '',
      quantity: 1,
      amount: undefined
    });
  }
}
