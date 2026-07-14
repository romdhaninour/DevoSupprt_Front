import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';
import { ImageCompressionUtil } from '../utils/image-compression.util';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, this.getAuthHeaders());
  }

  getArchivedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/archived`);
  }

  createUser(data: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, data, this.getAuthHeaders());
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}`, data, this.getAuthHeaders());
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me/profile`, this.getAuthHeaders());
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`, this.getAuthHeaders());
  }

  activateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/activate`, {}, this.getAuthHeaders());
  }

  deactivateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/deactivate`, {}, this.getAuthHeaders());
  }

  archiveUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/archive`, {}, this.getAuthHeaders());
  }

  restoreUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/restore`, {}, this.getAuthHeaders());
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`, this.getAuthHeaders());
  }

  importUsers(file: File): Observable<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; failed: number; errors: string[] }>(`${this.apiUrl}/users/import`, formData, this.getAuthHeaders());
  }

  exportUsers(search?: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/users/export`, { search }, {
      headers: this.getAuthHeaders().headers,
      responseType: 'blob',
    });
  }

  getDevices(page?: number, limit?: number, search?: string, status?: string, type?: string): Observable<{ devices: any[]; total: number; page: number; limit: number }> {
    let url = `${this.apiUrl}/devices`;
    const params = [];
    if (page) params.push(`page=${page}`);
    if (limit) params.push(`limit=${limit}`);
    if (search) params.push(`search=${search}`);
    if (status && status !== 'all') params.push(`status=${status}`);
    if (type && type !== 'all') params.push(`type=${type}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<{ devices: any[]; total: number; page: number; limit: number }>(url, this.getAuthHeaders());
  }

  getAssignedDevices(page?: number, limit?: number, search?: string, userId?: string): Observable<{ devices: any[]; total: number; page: number; limit: number }> {
    let url = `${this.apiUrl}/devices/assigned`;
    const params = [];
    if (page) params.push(`page=${page}`);
    if (limit) params.push(`limit=${limit}`);
    if (search) params.push(`search=${search}`);
    if (userId) params.push(`userId=${userId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<{ devices: any[]; total: number; page: number; limit: number }>(url, this.getAuthHeaders());
  }

  createDevice(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/devices`, data, this.getAuthHeaders());
  }

  async createDeviceWithPhoto(data: any, file: File): Promise<any> {
    let compressedFile = file;
    
    // Compress image before upload
    if (ImageCompressionUtil.isImage(file)) {
      try {
        compressedFile = await ImageCompressionUtil.compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.85,
          outputFormat: 'image/jpeg',
        });
        console.log(`Image compressed: ${ImageCompressionUtil.formatFileSize(file.size)} -> ${ImageCompressionUtil.formatFileSize(compressedFile.size)}`);
      } catch (error) {
        console.error('Image compression failed, using original:', error);
        compressedFile = file;
      }
    }
    
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, value instanceof Blob ? value : String(value));
      }
    });
    form.append('photo', compressedFile);
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/devices`, form, this.getAuthHeaders()));
  }

  updateDevice(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/devices/${id}`, data, this.getAuthHeaders());
  }

  async updateDeviceWithPhoto(id: string, data: any, file: File): Promise<any> {
    let compressedFile = file;
    
    // Compress image before upload
    if (ImageCompressionUtil.isImage(file)) {
      try {
        compressedFile = await ImageCompressionUtil.compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.85,
          outputFormat: 'image/jpeg',
        });
        console.log(`Image compressed: ${ImageCompressionUtil.formatFileSize(file.size)} -> ${ImageCompressionUtil.formatFileSize(compressedFile.size)}`);
      } catch (error) {
        console.error('Image compression failed, using original:', error);
        compressedFile = file;
      }
    }
    
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, value instanceof Blob ? value : String(value));
      }
    });
    form.append('photo', compressedFile);
    return firstValueFrom(this.http.patch<any>(`${this.apiUrl}/devices/${id}`, form, this.getAuthHeaders()));
  }

  async uploadDevicePhoto(id: string, file: File): Promise<any> {
    let compressedFile = file;
    
    // Compress image before upload
    if (ImageCompressionUtil.isImage(file)) {
      try {
        compressedFile = await ImageCompressionUtil.compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.85,
          outputFormat: 'image/jpeg',
        });
        console.log(`Image compressed: ${ImageCompressionUtil.formatFileSize(file.size)} -> ${ImageCompressionUtil.formatFileSize(compressedFile.size)}`);
      } catch (error) {
        console.error('Image compression failed, using original:', error);
        compressedFile = file;
      }
    }
    
    const form = new FormData();
    form.append('photo', compressedFile);
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/devices/${id}/photo`, form, this.getAuthHeaders()));
  }

  updateDeviceStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/devices/${id}/status`, { status }, this.getAuthHeaders());
  }

  allocateDevice(id: string, consultantId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/devices/${id}/allocate`, { consultantId }, this.getAuthHeaders());
  }

  returnDevice(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/devices/${id}/return`, {}, this.getAuthHeaders());
  }

  getConsultants(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/consultants`, this.getAuthHeaders());
  }

  deleteDevice(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/devices/${id}`, this.getAuthHeaders());
  }

  importDevices(file: File): Observable<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; failed: number; errors: string[] }>(`${this.apiUrl}/devices/import`, formData, this.getAuthHeaders());
  }

  exportDevices(search?: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/devices/export`, { search }, {
      headers: this.getAuthHeaders().headers,
      responseType: 'blob',
    });
  }

  getHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  // Ticket API methods
  createTicket(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets`, data, this.getAuthHeaders());
  }

  getTickets(status?: string, priority?: string, issueType?: string, startDate?: string, endDate?: string, mine?: boolean): Observable<{ tickets: any[]; total: number }> {
    let url = `${this.apiUrl}/tickets`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (priority) params.push(`priority=${priority}`);
    if (issueType) params.push(`issueType=${issueType}`);
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (mine) params.push(`mine=true`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<{ tickets: any[]; total: number }>(url, this.getAuthHeaders());
  }

  getTicket(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/${id}`, this.getAuthHeaders());
  }

  updateTicketStatus(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tickets/${id}/status`, data, this.getAuthHeaders());
  }

  assignTicket(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tickets/${id}/assign`, data, this.getAuthHeaders());
  }

  addTicketComment(id: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets/${id}/comments`, data, this.getAuthHeaders());
  }

  deleteTicket(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tickets/${id}`, this.getAuthHeaders());
  }
}
