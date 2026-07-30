import { CommonModule } from '@angular/common';
import { Component, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { NotificationService, Notification } from '../../../../services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent]
})
export class NotificationDropdownComponent {
  isOpen = signal(false);

  readonly notifying = computed(() => this.notificationService.hasUnread());
  readonly unreadCount = computed(() => this.notificationService.unreadCount());
  readonly notifications = computed(() => this.notificationService.notifications());

  constructor(
    public notificationService: NotificationService,
    private router: Router
  ) {}

  toggleDropdown() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.notificationService.markAllAsRead();
    }
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  navigateToNotification(notification: Notification) {
    this.closeDropdown();
    const type = notification.type;

    if (type.startsWith('device_') || type === 'maintenance_due') {
      this.router.navigate(['/device-management']);
    } else if (type.startsWith('ticket_')) {
      if (notification.referenceId) {
        this.router.navigate(['/tickets', notification.referenceId]);
      } else {
        this.router.navigate(['/tickets']);
      }
    } else if (type === 'user_signup' || type === 'activation') {
      this.router.navigate(['/user-management']);
    } else if (type === 'chat_message') {
      this.router.navigate(['/chat']);
    }
  }

  deleteNotification(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }
}