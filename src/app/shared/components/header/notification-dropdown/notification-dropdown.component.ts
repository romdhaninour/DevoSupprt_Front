import { CommonModule } from '@angular/common';
import { Component, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { NotificationService } from '../../../../services/notification.service';

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

  constructor(public notificationService: NotificationService) {}

  toggleDropdown() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.notificationService.markAllAsRead();
    }
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  get canViewNotifications() {
    const userRole = localStorage.getItem('user_role');
    return userRole === 'ADMIN' || userRole === 'IT';
  }
}