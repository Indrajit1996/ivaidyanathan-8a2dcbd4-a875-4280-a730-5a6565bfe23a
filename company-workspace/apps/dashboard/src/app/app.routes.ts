import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { loginGuard } from './auth/login.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'log',
    loadComponent: () => import('./audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
