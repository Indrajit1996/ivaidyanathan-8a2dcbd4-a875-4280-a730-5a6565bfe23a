import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../auth/auth.service';
import { TaskService, AuditLog } from '../services/task.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  currentUser: User | null = null;
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  isLoading = false;
  errorMessage = '';

  // Filter options
  filterUserId = '';
  filterAction = '';
  filterResource = '';
  filterStartDate = '';
  filterEndDate = '';
  filterLimit = 100;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;

      // Check if user is OWNER or ADMIN
      if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
        this.router.navigate(['/dashboard']);
        return;
      }

      this.loadAuditLogs();
    });
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: any = {};
    if (this.filterUserId) filters.userId = this.filterUserId;
    if (this.filterAction) filters.action = this.filterAction;
    if (this.filterResource) filters.resource = this.filterResource;
    if (this.filterStartDate) filters.startDate = this.filterStartDate;
    if (this.filterEndDate) filters.endDate = this.filterEndDate;
    if (this.filterLimit) filters.limit = this.filterLimit;

    this.taskService.getAuditLogs(filters).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.filteredLogs = logs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.errorMessage = error.error?.message || 'Failed to load audit logs';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadAuditLogs();
  }

  clearFilters(): void {
    this.filterUserId = '';
    this.filterAction = '';
    this.filterResource = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterLimit = 100;
    this.loadAuditLogs();
  }

  getActionBadgeClass(action: string): string {
    if (action.includes('CREATE')) return 'badge-success';
    if (action.includes('UPDATE')) return 'badge-info';
    if (action.includes('DELETE')) return 'badge-danger';
    if (action.includes('READ')) return 'badge-secondary';
    if (action.includes('DENIED') || action.includes('FAILED')) return 'badge-warning';
    return 'badge-default';
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  formatDetails(details: any): string {
    if (!details) return '-';
    return JSON.stringify(details, null, 2);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
