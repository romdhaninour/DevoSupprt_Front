import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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
} from '../../models/ticket.model';

interface Device {
  id: string;
  name: string;
  type: string;
  owner: string;
  assignedToName: string;
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
  private readonly router = inject(Router);

  // Expose enums to the template
  readonly TicketStatus = TicketStatus;
  readonly TicketPriority = TicketPriority;

  tickets = signal<Ticket[]>([]);
  devices = signal<Device[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // View state
  showCreateModal = signal(false);
  showDetailModal = signal(false);
  selectedTicket = signal<any>(null);
  newComment = signal('');
  itStaff = signal<any[]>([]);

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

  // Sort state
  sortOrder = signal<'desc' | 'asc'>('desc');

  // IT/ADMIN filters
  statusFilter = signal<string>('all');
  priorityFilter = signal<string>('all');
  issueTypeFilter = signal<string>('all');

  // Device search state
  deviceSearchTerm = signal('');
  showDeviceDropdown = signal(false);
  filteredDevices = computed(() => {
    const term = this.deviceSearchTerm().toLowerCase();
    return this.devices().filter(d =>
      !term || d.name.toLowerCase().includes(term) || d.type.toLowerCase().includes(term) || d.assignedToName.toLowerCase().includes(term)
    );
  });

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

    if (this.isIT()) {
      this.loadITStaff();
    }
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
      this.sortOrder(),
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
    if (this.isIT()) {
      return this.apiService.getDevices(1, 1000).pipe(
        tap((data) => {
          this.apiService.getUsers().subscribe({
            next: (users) => {
              const userMap = new Map(users.map((u: any) => [u._id, `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email]));
              const mappedDevices = data.devices.map((d: any) => ({
                id: d._id || d.id,
                name: d.name,
                type: d.type,
                owner: d.owner || '',
                assignedToName: d.assignedTo ? (userMap.get(d.assignedTo) || 'Inconnu') : '',
              }));
              this.devices.set(mappedDevices);
            },
            error: () => {
              const mappedDevices = data.devices.map((d: any) => ({
                id: d._id || d.id,
                name: d.name,
                type: d.type,
                owner: d.owner || '',
                assignedToName: '',
              }));
              this.devices.set(mappedDevices);
            }
          });
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
            type: d.type,
            owner: d.owner || '',
            assignedToName: '',
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

  openCreateModal(preselectedDeviceId?: string) {
    this.loadDevices().subscribe(() => {
      this.createForm.set({
        title: '',
        description: '',
        deviceId: preselectedDeviceId || '',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      if (preselectedDeviceId) {
        const device = this.devices().find(d => d.id === preselectedDeviceId);
        this.deviceSearchTerm.set(device ? `${device.name} (${device.type})` : '');
      } else {
        this.deviceSearchTerm.set('');
      }
      this.showDeviceDropdown.set(false);
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
    this.deviceSearchTerm.set('');
    this.showDeviceDropdown.set(false);
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
    const base = this.isMyTicketsView() ? '/my-tickets' : '/tickets';
    this.router.navigate([base, ticket._id]);
  }

  selectDevice(device: Device) {
    this.createForm.update(f => ({ ...f, deviceId: device.id }));
    this.deviceSearchTerm.set(`${device.name} (${device.type})`);
    this.showDeviceDropdown.set(false);
  }

  onDeviceSearchFocus() {
    this.showDeviceDropdown.set(true);
  }

  onDeviceSearchInput(value: string) {
    this.deviceSearchTerm.set(value);
    this.showDeviceDropdown.set(true);
    if (!value) {
      this.createForm.update(f => ({ ...f, deviceId: '' }));
    }
  }

  getSelectedDeviceName(): string {
    const deviceId = this.createForm().deviceId;
    if (!deviceId) return '';
    const device = this.devices().find(d => d.id === deviceId);
    return device ? `${device.name} (${device.type})` : '';
  }

  closeDeviceDropdown() {
    setTimeout(() => this.showDeviceDropdown.set(false), 200);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
  }

  async updateTicketStatus(status: TicketStatus, resolution?: ResolutionType) {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    try {
      const body: any = { status };
      if (resolution) body.resolution = resolution;
      const updated = await firstValueFrom(this.apiService.updateTicketStatus(ticket._id, body));
      this.selectedTicket.set(updated);
    } catch {
      this.error.set('Failed to update ticket status');
    }
  }

  async assignTicket(staffId: string) {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    try {
      const updated = await firstValueFrom(this.apiService.assignTicket(ticket._id, { assignedTo: staffId }));
      this.selectedTicket.set(updated);
    } catch {
      this.error.set('Failed to assign ticket');
    }
  }

  async addComment() {
    const ticket = this.selectedTicket();
    if (!ticket || !this.newComment().trim()) return;
    try {
      const updated = await firstValueFrom(this.apiService.addTicketComment(ticket._id, { text: this.newComment() }));
      this.selectedTicket.set(updated);
      this.newComment.set('');
    } catch {
      this.error.set('Failed to add comment');
    }
  }

  async deleteTicket() {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await firstValueFrom(this.apiService.deleteTicket(ticket._id));
      this.showDetailModal.set(false);
      this.loadTickets();
    } catch {
      this.error.set('Failed to delete ticket');
    }
  }

  getIssueTypeLabel(type: IssueType): string {
    const labels: Record<string, string> = {
      [IssueType.DAMAGED]: 'Endommagé',
      [IssueType.DESTROYED]: 'Détruit',
      [IssueType.MALFUNCTION]: 'Dysfonctionnement',
      [IssueType.OTHER]: 'Autre',
    };
    return labels[type] || type;
  }

  getResolutionLabel(resolution?: ResolutionType): string {
    const labels: Record<string, string> = {
      [ResolutionType.REPAIR]: 'Réparation',
      [ResolutionType.REPLACE]: 'Remplacement',
    };
    return resolution ? (labels[resolution] || resolution) : '';
  }

  getStaffDisplayName(staff: any): string {
    if (staff.prenom || staff.nom) {
      return `${staff.prenom || ''} ${staff.nom || ''}`.trim();
    }
    return staff.email || 'Utilisateur inconnu';
  }

  getCurrentUserInitials(): string {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return '?';
      const user = JSON.parse(userStr);
      return ((user.prenom?.[0] || '') + (user.nom?.[0] || '')).toUpperCase() || '?';
    } catch {
      return '?';
    }
  }

  loadITStaff() {
    this.apiService.getUsers().subscribe({
      next: (users: any[]) => {
        this.itStaff.set(users.filter((u: any) => u.role === 'IT'));
      },
      error: () => {
        this.itStaff.set([]);
      }
    });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadTickets();
  }

  toggleSortOrder() {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
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
    const labels: Record<string, string> = {
      [TicketStatus.OPEN]: 'Nouveau',
      [TicketStatus.IN_PROGRESS]: 'En cours',
      [TicketStatus.RESOLVED]: 'Résolu',
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

  // Stats for IT/ADMIN view
  openTickets = computed(() => this.tickets().filter(t => t.status === TicketStatus.OPEN).length);
  urgentTickets = computed(() => this.tickets().filter(t => t.priority === TicketPriority.URGENT && t.status !== TicketStatus.RESOLVED).length);
  inProgressTickets = computed(() => this.tickets().filter(t => t.status === TicketStatus.IN_PROGRESS).length);
  resolvedTickets = computed(() => this.tickets().filter(t => t.status === TicketStatus.RESOLVED).length);

  formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }
}