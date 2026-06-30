import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'user_signup' | 'activation' | 'other';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications.asObservable();

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications() {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.notifications.next(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (e) {
        this.notifications.next([]);
      }
    }
  }

  private saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications.value));
  }

  addNotification(message: string, type: 'user_signup' | 'activation' | 'other' = 'other') {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      read: false,
      type
    };
    const current = this.notifications.value;
    this.notifications.next([notification, ...current]);
    this.saveNotifications();
  }

  markAsRead(id: string) {
    const current = this.notifications.value;
    const updated = current.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notifications.next(updated);
    this.saveNotifications();
  }

  markAllAsRead() {
    const current = this.notifications.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.notifications.next(updated);
    this.saveNotifications();
  }

  clearNotifications() {
    this.notifications.next([]);
    this.saveNotifications();
  }

  get unreadCount(): number {
    return this.notifications.value.filter(n => !n.read).length;
  }
}
