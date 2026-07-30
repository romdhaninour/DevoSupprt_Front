import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  _id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: string;
  userEmail: string;
  userName?: string;
  recipientRoles: string[];
  referenceId?: string;
  referenceModel?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000';
  private socket: Socket | null = null;

  private notificationsSignal = signal<Notification[]>([]);
  private loadingSignal = signal<boolean>(false);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly unreadCount = computed(() =>
    this.notificationsSignal().filter(n => !n.read).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor(private http: HttpClient) {
    this.loadNotifications();
    this.connectSocket();
  }

  private getAuthHeaders(): { headers: HttpHeaders } {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  private connectSocket() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.socket = io(`${this.apiUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    this.socket.on('new_notification', (notification: Notification) => {
      this.notificationsSignal.update(current => [
        { ...notification, timestamp: new Date(notification.createdAt) },
        ...current
      ]);
    });
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  loadNotifications() {
    this.loadingSignal.set(true);
    this.http.get<Notification[]>(`${this.apiUrl}/notifications`, this.getAuthHeaders())
      .subscribe({
        next: (notifications) => {
          this.notificationsSignal.set(
            notifications.map(n => ({
              ...n,
              timestamp: new Date(n.createdAt)
            }))
          );
          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Failed to load notifications:', error);
          this.loadingSignal.set(false);
        }
      });
  }

  markAsRead(id: string) {
    this.http.patch<Notification>(`${this.apiUrl}/notifications/${id}/read`, {}, this.getAuthHeaders())
      .subscribe({
        next: (updated) => {
          this.notificationsSignal.update(current =>
            current.map(n => n._id === id ? { ...n, read: true } : n)
          );
        },
        error: (error) => {
          console.error('Failed to mark notification as read:', error);
        }
      });
  }

  markAllAsRead() {
    this.http.patch(`${this.apiUrl}/notifications/read-all`, {}, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.notificationsSignal.update(current =>
            current.map(n => ({ ...n, read: true }))
          );
        },
        error: (error) => {
          console.error('Failed to mark all notifications as read:', error);
        }
      });
  }

  deleteNotification(id: string) {
    this.http.delete(`${this.apiUrl}/notifications/${id}`, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.notificationsSignal.update(current =>
            current.filter(n => n._id !== id)
          );
        },
        error: (error) => {
          console.error('Failed to delete notification:', error);
        }
      });
  }

  clearNotifications() {
    this.notificationsSignal.set([]);
  }

  refreshNotifications() {
    this.loadNotifications();
  }
}
