import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';
import { ImageCompressionUtil } from '../utils/image-compression.util';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getUsers(sortOrder?: string): Observable<User[]> {
    let url = `${this.apiUrl}/users`;
    if (sortOrder) url += `?sortOrder=${sortOrder}`;
    return this.http.get<User[]>(url, this.getAuthHeaders());
  }

  getArchivedUsers(sortOrder?: string): Observable<User[]> {
    let url = `${this.apiUrl}/users/archived`;
    if (sortOrder) url += `?sortOrder=${sortOrder}`;
    return this.http.get<User[]>(url, this.getAuthHeaders());
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

  getDevices(page?: number, limit?: number, search?: string, status?: string, type?: string, sortOrder?: string): Observable<{ devices: any[]; total: number; page: number; limit: number }> {
    let url = `${this.apiUrl}/devices`;
    const params = [];
    if (page) params.push(`page=${page}`);
    if (limit) params.push(`limit=${limit}`);
    if (search) params.push(`search=${search}`);
    if (status && status !== 'all') params.push(`status=${status}`);
    if (type && type !== 'all') params.push(`type=${type}`);
    if (sortOrder) params.push(`sortOrder=${sortOrder}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<{ devices: any[]; total: number; page: number; limit: number }>(url, this.getAuthHeaders());
  }

  getAssignedDevices(page?: number, limit?: number, search?: string, userId?: string, sortOrder?: string): Observable<{ devices: any[]; total: number; page: number; limit: number }> {
    let url = `${this.apiUrl}/devices/assigned`;
    const params = [];
    if (page) params.push(`page=${page}`);
    if (limit) params.push(`limit=${limit}`);
    if (search) params.push(`search=${search}`);
    if (userId) params.push(`userId=${userId}`);
    if (sortOrder) params.push(`sortOrder=${sortOrder}`);
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

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`, this.getAuthHeaders());
  }

  // Ticket API methods
  createTicket(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets`, data, this.getAuthHeaders());
  }

  getTickets(status?: string, priority?: string, issueType?: string, startDate?: string, endDate?: string, mine?: boolean, sortOrder?: string): Observable<{ tickets: any[]; total: number }> {
    let url = `${this.apiUrl}/tickets`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (priority) params.push(`priority=${priority}`);
    if (issueType) params.push(`issueType=${issueType}`);
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (mine) params.push(`mine=true`);
    if (sortOrder) params.push(`sortOrder=${sortOrder}`);
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

  getTicketsByUserId(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets/user/${userId}`, this.getAuthHeaders());
  }

  // Device Types API
  getDeviceTypes(sortOrder?: string): Observable<any[]> {
    let url = `${this.apiUrl}/device-types`;
    if (sortOrder) url += `?sortOrder=${sortOrder}`;
    return this.http.get<any[]>(url, this.getAuthHeaders());
  }

  createDeviceType(data: { name: string; description?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/device-types`, data, this.getAuthHeaders());
  }

  updateDeviceType(id: string, data: { name: string; description?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/device-types/${id}`, data, this.getAuthHeaders());
  }

  deleteDeviceType(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/device-types/${id}`, this.getAuthHeaders());
  }

  // Device Maintenance API (embedded in Device)
  getMaintenanceDevices(month?: string, year?: string): Observable<any[]> {
    let url = `${this.apiUrl}/devices/with-maintenance`;
    const params = [];
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<any[]>(url, this.getAuthHeaders());
  }

  updateDeviceMaintenance(id: string, data: { maintenanceDescription?: string; maintenanceEndDate?: string; maintenanceFrequency?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/devices/${id}/maintenance`, data, this.getAuthHeaders());
  }

  markDeviceAsMaintained(id: string, performedDate?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/devices/${id}/mark-maintained`, performedDate ? { performedDate } : {}, this.getAuthHeaders());
  }

  getDeviceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/devices/${id}`, this.getAuthHeaders());
  }
}
