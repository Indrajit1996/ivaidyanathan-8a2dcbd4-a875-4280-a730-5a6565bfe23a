import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already authenticated, redirect to dashboard
  if (authService.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  // Otherwise, allow access to login page
  return true;
};
