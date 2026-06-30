import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit {
  isOpen = false;
  notifying = true;
  unreadCount = 0;

  constructor(public notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(notifications => {
      this.unreadCount = notifications.filter(n => !n.read).length;
      this.notifying = this.unreadCount > 0;
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notificationService.markAllAsRead();
      this.notifying = false;
    }
  }

  closeDropdown() {
    this.isOpen = false;
  }

  get isAdmin() {
    const userRole = localStorage.getItem('user_role');
    return userRole === 'ADMIN';
  }
}