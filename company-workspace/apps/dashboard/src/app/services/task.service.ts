import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type?: string;
  dueDate?: string;
  ownerId: string;
  organizationId: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type?: string;
  dueDate?: string;
  assignedToId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type?: string;
  dueDate?: string;
  assignedToId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * POST /tasks – Create task (with permission check)
   */
  createTask(taskData: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(
      `${this.apiUrl}/tasks`,
      taskData,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * GET /tasks – List accessible tasks (scoped to role/org)
   */
  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/tasks`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * GET /tasks/:id – Get single task
   */
  getTaskById(taskId: string): Observable<Task> {
    return this.http.get<Task>(
      `${this.apiUrl}/tasks/${taskId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * GET /tasks/status/:status – Get tasks by status
   */
  getTasksByStatus(status: string): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/tasks/status/${status}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * PUT/PATCH /tasks/:id – Edit task (if permitted)
   */
  updateTask(taskId: string, updateData: UpdateTaskDto): Observable<Task> {
    return this.http.patch<Task>(
      `${this.apiUrl}/tasks/${taskId}`,
      updateData,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * DELETE /tasks/:id – Delete task (if permitted)
   */
  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tasks/${taskId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * GET /audit-log – View access logs (Owner/Admin only)
   * Note: This endpoint needs to be added to the backend
   */
  getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Observable<AuditLog[]> {
    let queryParams = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());
      queryParams = `?${params.toString()}`;
    }

    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/audit-logs${queryParams}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
