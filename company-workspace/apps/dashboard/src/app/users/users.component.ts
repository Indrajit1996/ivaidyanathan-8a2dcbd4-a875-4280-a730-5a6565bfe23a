import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../auth/auth.service';
import { UserService } from '../services/user.service';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  providers: [UserService],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  currentUser: User | null = null;
  users: UserProfile[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUsers();
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = error.error?.message || 'Failed to load users';
        this.isLoading = false;
      }
    });
  }

  deleteUser(user: UserProfile): void {
    if (user.id === this.currentUser?.id) {
      this.errorMessage = 'You cannot delete yourself';
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = `User ${user.email} has been deleted successfully`;
        this.users = this.users.filter(u => u.id !== user.id);
        this.isLoading = false;

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.errorMessage = error.error?.message || 'Failed to delete user. You may not have permission.';
        this.isLoading = false;
      }
    });
  }

  canDeleteUsers(): boolean {
    return this.currentUser?.role === 'OWNER';
  }

  canDeleteUser(user: UserProfile): boolean {
    return this.canDeleteUsers() && user.id !== this.currentUser?.id;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'OWNER':
        return 'role-owner';
      case 'ADMIN':
        return 'role-admin';
      case 'VIEWER':
        return 'role-viewer';
      default:
        return 'role-default';
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
