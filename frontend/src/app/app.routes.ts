import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BikeListComponent } from './components/bike-list/bike-list.component';
import { BikeManagementComponent } from './components/bike-management/bike-management.component';
import { authGuard } from './guards/auth.guard';
import { PartManagementComponent } from './components/part-management/part-management.component';
import { TransactionLogComponent } from './components/transaction-log/transaction-log.component';

export const routes: Routes = [
  { path: '', component: BikeListComponent, title: 'Yamaha Bikes' },
  { path: 'login', component: LoginComponent, title: 'Login' },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'bikes', pathMatch: 'full' },
      { path: 'bikes', component: BikeManagementComponent, title: 'Manage Bikes' },
      { path: 'parts', component: PartManagementComponent },
      { path: 'transactions', component: TransactionLogComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
