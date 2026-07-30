import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-meta-card',
  imports: [CommonModule],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent {
  @Input() user: any = {};

  get displayName() {
    return `${(this.user.prenom || '').trim()} ${(this.user.nom || '').trim()}`.trim() || 'User';
  }

  get avatar() {
    const userId = this.user._id || (typeof window !== 'undefined'
      ? localStorage.getItem('user_id') || ''
      : '');

    const profilePicture = this.user.profilePicture ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('user_profile_picture') || ''
        : '');

    if (userId && profilePicture) {
      return `http://localhost:3000/users/${userId}/profile-picture`;
    }

    return '';
  }

  get initials() {
    const prenom = this.user.prenom || '';
    const nom = this.user.nom || '';
    return `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();
  }

  handleImageError(event: any) {
    event.target.src = '/images/user/owner.jpg';
  }

  get roleBadgeColors() {
    const role = (this.user.role || '').toUpperCase();
    switch (role) {
      case 'ADMIN':
        return {
          bg: 'bg-rose-100 dark:bg-rose-900/30',
          text: 'text-rose-700 dark:text-rose-400',
          border: 'border-rose-200 dark:border-rose-800',
          ring: 'ring-rose-500 dark:ring-rose-400'
        };
      case 'IT':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800',
          ring: 'ring-amber-500 dark:ring-amber-400'
        };
      case 'CONSULTANT':
        return {
          bg: 'bg-cyan-100 dark:bg-cyan-900/30',
          text: 'text-cyan-700 dark:text-cyan-400',
          border: 'border-cyan-200 dark:border-cyan-800',
          ring: 'ring-cyan-500 dark:ring-cyan-400'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700',
          ring: 'ring-gray-400 dark:ring-gray-500'
        };
    }
  }

  get roleDisplayName() {
    const role = (this.user.role || '').toUpperCase();
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'IT': return 'IT';
      case 'CONSULTANT': return 'Consultant';
      default: return role || 'User';
    }
  }
}
