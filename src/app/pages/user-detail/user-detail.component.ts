import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { Ticket } from '../../models/ticket.model';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, UserMetaCardComponent, UserInfoCardComponent],
  templateUrl: './user-detail.component.html',
  styles: ``
})
export class UserDetailComponent implements OnInit {
  user = signal<User | null>(null);
  tickets = signal<Ticket[]>([]);
  devices = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  userId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUserData();
    } else {
      this.error.set('User ID not found');
      this.loading.set(false);
    }
  }

  loadUserData() {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loadUserTickets();
        this.loadUserDevices();
      },
      error: (err) => {
        this.error.set('Failed to load user data');
        this.loading.set(false);
      }
    });
  }

  loadUserTickets() {
    this.apiService.getTicketsByUserId(this.userId).subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tickets:', err);
        this.loading.set(false);
      }
    });
  }

  loadUserDevices() {
    this.apiService.getAssignedDevices(1, 100, '', this.userId).subscribe({
      next: (response) => {
        this.devices.set(response.devices || []);
      },
      error: (err) => {
        console.error('Failed to load devices:', err);
      }
    });
  }

  goBack() {
    const user = this.user();
    if (user?.status === 'archived') {
      this.router.navigate(['/archived-users']);
    } else {
      this.router.navigate(['/user-management']);
    }
  }

  getRoleBadgeColor(role: string): string {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'CONSULTANT':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
      case 'IT':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  }

  getTicketStatusColor(status: string): string {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_progress':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'closed':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getTicketPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getDeviceStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'assigned':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'maintenance':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'retired':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getTicketStatusLabel(status: string): string {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Fermé';
      default: return status;
    }
  }

  getDeviceStatusLabel(status: string): string {
    switch (status) {
      case 'available': return 'Disponible';
      case 'assigned': return 'Assigné';
      case 'maintenance': return 'Maintenance';
      case 'retired': return 'Retiré';
      default: return status;
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const fallback = parent.querySelector('div') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    const parent = img.parentElement;
    if (parent) {
      const fallback = parent.querySelector('div') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'none';
      }
    }
  }

  getProfilePictureUrl(user: User): string {
    if (user.profilePicture && user.profilePicture !== '') {
      return `http://localhost:3000/users/${user._id}/profile-picture`;
    }
    return '';
  }
}
