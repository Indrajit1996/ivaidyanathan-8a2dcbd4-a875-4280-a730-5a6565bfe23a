import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}

export interface DeleteUserResponse {
  message: string;
  deletedUserId: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * GET /api/users - Get all users in the organization
   */
  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.API_URL}/users`, {
      headers: this.getHeaders()
    });
  }

  /**
   * DELETE /api/users/:id - Delete a user (OWNER only)
   */
  deleteUser(userId: string): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.API_URL}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }
}
