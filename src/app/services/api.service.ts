import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getArchivedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/archived`);
  }

  createUser(data: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, data);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}`, data);
  }

  activateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/activate`, {});
  }

  deactivateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/deactivate`, {});
  }

  archiveUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/archive`, {});
  }

  restoreUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/restore`, {});
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`);
  }

  getHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
