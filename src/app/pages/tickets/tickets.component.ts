import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { firstValueFrom } from 'rxjs';
import { tap, catchError, of } from 'rxjs';
import {
  Ticket,
  IssueType,
  TicketStatus,
  TicketPriority,
  ResolutionType,
  CreateTicketDto,
  UpdateTicketStatusDto,
  AddCommentDto,
} from '../../models/ticket.model';
import { User } from '../../models/user.model';

type DeviceType = 'Laptop' | 'Desktop' | 'Mobile' | 'Tablet' | 'Printer' | 'Scanner' | 'Monitor' | 'Router' | 'Switch' | 'Access Point' | 'Camera' | 'Projecteur';

interface Device {
  id: string;
  name: string;
  type: DeviceType;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './tickets.component.html'
})
export class TicketsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  // Expose enums to the template
  readonly TicketStatus = TicketStatus;
  readonly TicketPriority = TicketPriority;
  readonly IssueType = IssueType;
  readonly ResolutionType = ResolutionType;

  tickets = signal<Ticket[]>([]);
  devices = signal<Device[]>([]);
  itStaff = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // View state
  selectedTicket = signal<Ticket | null>(null);
  showCreateModal = signal(false);
  showDetailModal = signal(false);

  // Form state
  createForm = signal<Partial<CreateTicketDto>>({
    title: '',
    description: '',
    deviceId: '',
    issueType: IssueType.DAMAGED,
    priority: TicketPriority.MEDIUM,
  });
  createLoading = signal(false);
  createError = signal<string | null>(null);

  // Comment state
  newComment = signal('');
  commentLoading = signal(false);

  // Status update loading state
  statusLoading = signal(false);

  // Assignment loading state
  assignLoading = signal(false);

  // Resolution choice UI state
  showResolutionChoice = signal(false);

  // Delete loading state
  deleteLoading = signal(false);

  // IT/ADMIN filters
  statusFilter = signal<string>('all');
  priorityFilter = signal<string>('all');
  issueTypeFilter = signal<string>('all');

  // User role
  userRole = signal(localStorage.getItem('user_role') || '');
  isIT = computed(() => this.userRole() === 'IT' || this.userRole() === 'ADMIN');
  viewMode = signal<'all' | 'mine'>('all');
  isMyTicketsView = computed(() => this.viewMode() === 'mine');

  readonly itemsPerPage = 10;
  currentPage = signal(1);
  paginatedTickets = computed(() => {
    const allTickets = this.tickets();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return allTickets.slice(start, start + this.itemsPerPage);
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.tickets().length / this.itemsPerPage)));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));

  ngOnInit() {
    this.route.url.subscribe((segments) => {
      const path = segments[0]?.path || '';
      const nextViewMode = path === 'my-tickets' ? 'mine' : 'all';
      this.viewMode.set(nextViewMode);
      this.loadTickets();
    });

    if (this.isIT()) {
      this.loadITStaff();
    }

    // Check for query parameters to pre-fill create form and auto-open modal
    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);
      const deviceId = params['deviceId'];
      const deviceName = params['deviceName'];
      
      if (deviceId && deviceId !== 'undefined' && deviceId !== '' && deviceName) {
        console.log('Valid deviceId found, will open modal with preselected device:', deviceId);
        // Load devices first, then open modal with preselected device
        this.loadDevices().subscribe(() => {
          console.log('Devices loaded:', this.devices());
          console.log('Opening modal with deviceId:', deviceId);
          this.openCreateModal(deviceId);
        });
      }
    });
  }

  loadTickets() {
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(1);
    this.apiService.getTickets(
      this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      this.priorityFilter() !== 'all' ? this.priorityFilter() : undefined,
      this.issueTypeFilter() !== 'all' ? this.issueTypeFilter() : undefined,
      undefined,
      undefined,
      this.isMyTicketsView(),
    ).subscribe({
      next: (data) => {
        this.tickets.set(data.tickets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load tickets');
        this.loading.set(false);
      }
    });
  }

  loadDevices() {
    // IT/Admin users can create tickets for any device, so load all devices
    // Consultants can only create tickets for their assigned devices
    if (this.isIT()) {
      return this.apiService.getDevices(1, 1000).pipe(
        tap((data) => {
          const mappedDevices = data.devices.map((d: any) => ({
            id: d._id || d.id,
            name: d.name,
            type: d.type
          }));
          this.devices.set(mappedDevices);
        }),
        catchError((err) => {
          console.error('Failed to load devices:', err);
          this.devices.set([]);
          return of({ devices: [], total: 0, page: 1, limit: 10 });
        })
      );
    } else {
      return this.apiService.getAssignedDevices().pipe(
        tap((data) => {
          const mappedDevices = data.devices.map((d: any) => ({
            id: d._id || d.id,
            name: d.name,
            type: d.type
          }));
          this.devices.set(mappedDevices);
        }),
        catchError((err) => {
          console.error('Failed to load devices:', err);
          this.devices.set([]);
          return of({ devices: [], total: 0, page: 1, limit: 10 });
        })
      );
    }
  }

  loadITStaff() {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.itStaff.set(users.filter(u => u.role === 'IT' || u.role === 'ADMIN'));
      },
      error: () => {
        this.itStaff.set([]);
      }
    });
  }

  openCreateModal(preselectedDeviceId?: string) {
    this.loadDevices().subscribe(() => {
      this.createForm.set({
        title: '',
        description: '',
        deviceId: preselectedDeviceId || '',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      this.createError.set(null);
      this.showCreateModal.set(true);
    });
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.createForm.set({
      title: '',
      description: '',
      deviceId: '',
      issueType: IssueType.DAMAGED,
      priority: TicketPriority.MEDIUM,
    });
    this.createError.set(null);
  }

  async createTicket() {
    const form = this.createForm();
    console.log('Creating ticket with form:', form);
    
    if (!form.title || !form.description || !form.issueType) {
      this.createError.set('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (!form.deviceId || form.deviceId === 'undefined' || form.deviceId === '' || form.deviceId === undefined) {
      this.createError.set('Veuillez sélectionner un appareil');
      return;
    }

    this.createLoading.set(true);
    this.createError.set(null);

    try {
      await firstValueFrom(this.apiService.createTicket(form));
      this.createLoading.set(false);
      this.closeCreateModal();
      this.loadTickets();
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      this.createError.set(err.error?.message || 'Failed to create ticket');
      this.createLoading.set(false);
    }
  }

  openTicketDetail(ticket: Ticket) {
    this.selectedTicket.set(ticket);
    this.showDetailModal.set(true);
    this.newComment.set('');
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedTicket.set(null);
  }

  async updateTicketStatus(status: TicketStatus, resolution?: ResolutionType) {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    this.statusLoading.set(true);
    try {
      const updateData: UpdateTicketStatusDto = { status };
      if (resolution) {
        updateData.resolution = resolution;
      }
      const updatedTicket = await firstValueFrom(this.apiService.updateTicketStatus(ticket._id, updateData));
      this.selectedTicket.set(updatedTicket);
      
      // Update the ticket in the local array instead of refetching the entire list
      this.tickets.update(tickets => 
        tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t)
      );
    } catch (err) {
      this.error.set('Failed to update ticket status');
    } finally {
      this.statusLoading.set(false);
    }
  }

  async assignTicket(userId: string) {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    this.assignLoading.set(true);
    try {
      const updatedTicket = await firstValueFrom(this.apiService.assignTicket(ticket._id, { assignedTo: userId }));
      this.selectedTicket.set(updatedTicket);
      
      // Update the ticket in the local array instead of refetching the entire list
      this.tickets.update(tickets => 
        tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t)
      );
    } catch (err) {
      this.error.set('Failed to assign ticket');
    } finally {
      this.assignLoading.set(false);
    }
  }

  onAssignChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.assignTicket(value);
  }

  async addComment() {
    const ticket = this.selectedTicket();
    const comment = this.newComment();
    if (!ticket || !comment.trim()) return;

    this.commentLoading.set(true);
    try {
      const updatedTicket = await firstValueFrom(this.apiService.addTicketComment(ticket._id, { text: comment }));
      this.newComment.set('');
      this.selectedTicket.set(updatedTicket);
      
      // Update the ticket in the local array instead of refetching the entire list
      this.tickets.update(tickets => 
        tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t)
      );
    } catch (err) {
      this.error.set('Failed to add comment');
    } finally {
      this.commentLoading.set(false);
    }
  }

  getCurrentUserInitials(): string {
    const userJson = localStorage.getItem('user');
    if (!userJson) return '?';
    try {
      const user = JSON.parse(userJson);
      const prenom = user.prenom || '';
      const nom = user.nom || '';
      return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
    } catch {
      return '?';
    }
  }

  getStaffDisplayName(staff: User): string {
    const fullName = `${staff.prenom || ''} ${staff.nom || ''}`.trim();
    if (fullName && fullName.length > 1) {
      return fullName;
    }
    return staff.email || 'Utilisateur inconnu';
  }

  async deleteTicket() {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.')) {
      return;
    }

    this.deleteLoading.set(true);
    try {
      await firstValueFrom(this.apiService.deleteTicket(ticket._id));
      this.closeDetailModal();
      this.loadTickets();
    } catch (err) {
      this.error.set('Failed to delete ticket');
    } finally {
      this.deleteLoading.set(false);
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadTickets();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
  }

  getDisplayRangeEnd(): number {
    return Math.min(this.currentPage() * this.itemsPerPage, this.tickets().length);
  }

  getStatusLabel(status: TicketStatus): string {
    const labels = {
      [TicketStatus.OPEN]: 'Nouveau',
      [TicketStatus.IN_PROGRESS]: 'En cours',
      [TicketStatus.RESOLVED]: 'Résolu',
      [TicketStatus.CLOSED]: 'Fermé',
    };
    return labels[status] || status;
  }

  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.OPEN:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case TicketStatus.IN_PROGRESS:
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
      case TicketStatus.RESOLVED:
        return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800';
      case TicketStatus.CLOSED:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
    }
  }

  getPriorityLabel(priority: TicketPriority): string {
    const labels = {
      [TicketPriority.LOW]: 'Faible',
      [TicketPriority.MEDIUM]: 'Moyen',
      [TicketPriority.HIGH]: 'Élevé',
      [TicketPriority.URGENT]: 'Urgent',
    };
    return labels[priority] || priority;
  }

  getPriorityClass(priority: TicketPriority): string {
    switch (priority) {
      case TicketPriority.LOW:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case TicketPriority.MEDIUM:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case TicketPriority.HIGH:
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case TicketPriority.URGENT:
        return 'bg-rose-600 text-white border-rose-600 shadow-sm dark:bg-rose-500 dark:text-white dark:border-rose-500';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
    }
  }

  getIssueTypeLabel(issueType: IssueType): string {
    const labels = {
      [IssueType.DAMAGED]: 'Endommagé',
      [IssueType.DESTROYED]: 'Détruit',
      [IssueType.MALFUNCTION]: 'Dysfonctionnement',
      [IssueType.OTHER]: 'Autre',
    };
    return labels[issueType] || issueType;
  }

  getResolutionLabel(resolution?: ResolutionType): string {
    if (!resolution) return '';
    const labels = {
      [ResolutionType.REPAIR]: 'Réparation',
      [ResolutionType.REPLACE]: 'Remplacement',
    };
    return labels[resolution] || resolution;
  }

  // Stats for IT/ADMIN view
  openTickets = computed(() => this.tickets().filter(t => t.status === TicketStatus.OPEN).length);
  urgentTickets = computed(() => this.tickets().filter(t => t.priority === TicketPriority.URGENT && t.status !== TicketStatus.CLOSED).length);
  inProgressTickets = computed(() => this.tickets().filter(t => t.status === TicketStatus.IN_PROGRESS).length);
  resolvedTickets = computed(() => this.tickets().filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length);

  formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }
}