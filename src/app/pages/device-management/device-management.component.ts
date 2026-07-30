import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { firstValueFrom } from 'rxjs';
import { IssueType, TicketPriority } from '../../models/ticket.model';

type DeviceStatus = 'available' | 'assigned' | 'maintenance' | 'retired';

interface Device {
  id: string;
  name: string;
  type: string;
  owner: string;
  email: string;
  status: DeviceStatus;
  serialNumber: string;
  department?: string;
  location?: string;
  purchaseDate?: string;
  assignedTo?: string | null;
  assignedAt?: string | null;
  assignedBy?: string | null;
  maintenanceEnabled?: boolean;
  maintenanceDescription?: string;
  maintenanceStartDate?: string | null;
  maintenanceEndDate?: string | null;
  maintenanceFrequency?: string | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
}

@Component({
  selector: 'app-device-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './device-management.component.html',
  styleUrl: './device-management.component.css'
})
export class DeviceManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  devices = signal<Device[]>([]);
  consultants = signal<User[]>([]);
  total = signal(0);
  currentPage = signal(1);
  itemsPerPage = 4;
  loading = signal(false);
  error = signal<string | null>(null);
  Math = Math;

  searchTerm = signal('');
  statusFilter = signal<'all' | DeviceStatus>('all');
  typeFilter = signal<'all' | string>('all');
  deviceTypes = signal<string[]>([]);
  isIT = signal(localStorage.getItem('user_role') === 'IT' || localStorage.getItem('user_role') === 'ADMIN');
  showAddForm = signal(false);
  editingDeviceId = signal<string | null>(null);
  importingDevices = signal(false);
  importFeedback = signal<string | null>(null);
  importFeedbackType = signal<'success' | 'error' | null>(null);
  // Allocation state
  selectedDeviceForAllocation = signal<Device | null>(null);
  selectedConsultantId = signal('');
  allocateLoading = signal(false);
  openActionMenuId = signal<string | null>(null);
  actionMenuPosition = signal<{top: number, left: number} | null>(null);
  sortOrder = signal<'desc' | 'asc'>('desc');

  filteredDevices = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const type = this.typeFilter();
    return this.devices().filter(d => {
      const matchesSearch = !search || d.name.toLowerCase().includes(search);
      const matchesStatus = status === 'all' || d.status === status;
      const matchesType = type === 'all' || d.type === type;
      return matchesSearch && matchesStatus && matchesType;
    });
  });

  openDatePicker(input: HTMLInputElement | null) {
    if (!input) { return; }
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
    }
  }

  // Ticket creation modal state
  showTicketModal = signal(false);
  ticketForm = signal({
    title: '',
    description: '',
    deviceId: '',
    issueType: 'damaged' as IssueType,
    priority: 'medium' as TicketPriority
  });
  ticketLoading = signal(false);
  ticketError = signal<string | null>(null);

  formDevice = signal<Partial<Device>>({
    name: '',
    type: 'Laptop',
    owner: '',
    email: '',
    status: 'available',
    serialNumber: '',
    maintenanceEnabled: false,
    maintenanceDescription: '',
    maintenanceStartDate: null,
    maintenanceEndDate: null,
    maintenanceFrequency: null,
  });

  ngOnInit() {
    this.loadDevices();
    this.loadConsultants();
    this.loadDeviceTypes();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadDevices();
  }

  toggleSortOrder() {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    this.currentPage.set(1);
    this.loadDevices();
  }

  loadDevices() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getDevices(this.currentPage(), this.itemsPerPage, this.searchTerm(), this.statusFilter(), this.typeFilter(), this.sortOrder()).subscribe({
      next: (data: any) => {
        this.devices.set(data.devices.map((device: any) => ({
          id: device._id ? String(device._id) : String(device.id ?? Date.now()),
          name: device.name,
          type: device.type,
          owner: device.owner,
          email: device.email || '',
          status: device.status,
          serialNumber: device.serialNumber,
          assignedTo: device.assignedTo || null,
          assignedAt: device.assignedAt || null,
          assignedBy: device.assignedBy || null,
          maintenanceEnabled: device.maintenanceEnabled || false,
          maintenanceDescription: device.maintenanceDescription || '',
          maintenanceStartDate: device.maintenanceStartDate || null,
          maintenanceEndDate: device.maintenanceEndDate || null,
          maintenanceFrequency: device.maintenanceFrequency || null,
          lastMaintenanceDate: device.lastMaintenanceDate || null,
          nextMaintenanceDate: device.nextMaintenanceDate || null,
        })));
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: () => {
        this.devices.set([]);
        this.loading.set(false);
      }
    });
  }

  loadConsultants() {
    this.apiService.getConsultants().subscribe({
      next: (users) => this.consultants.set(users),
      error: () => this.consultants.set([]),
    });
  }

  loadDeviceTypes() {
    this.apiService.getDeviceTypes().subscribe({
      next: (types) => this.deviceTypes.set(types.map((t: any) => t.name)),
      error: () => {}
    });
  }

  openAllocate(device: Device) {
    if (!this.isIT()) return;
    this.selectedDeviceForAllocation.set(device);
    this.selectedConsultantId.set('');
  }

  closeAllocate() {
    this.selectedDeviceForAllocation.set(null);
    this.selectedConsultantId.set('');
    this.allocateLoading.set(false);
  }

  confirmAllocate() {
    const device = this.selectedDeviceForAllocation();
    const consultantId = this.selectedConsultantId();
    if (!device || !consultantId) return;
    this.allocateLoading.set(true);
    this.apiService.allocateDevice(device.id, consultantId).subscribe({
      next: () => {
        this.loadDevices();
        this.closeAllocate();
      },
      error: () => {
        this.allocateLoading.set(false);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.openActionMenuId()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.device-action-menu-container')) {
        this.openActionMenuId.set(null);
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (this.openActionMenuId()) {
      this.openActionMenuId.set(null);
    }
  }

  toggleDeviceActionMenu(deviceId: string, event: MouseEvent) {
    event.stopPropagation();
    const current = this.openActionMenuId();
    if (current === deviceId) {
      this.openActionMenuId.set(null);
      this.actionMenuPosition.set(null);
    } else {
      this.openActionMenuId.set(deviceId);
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const menuWidth = 180;
      const padding = 8;
      const left = Math.min(Math.max(rect.left, padding), window.innerWidth - menuWidth - padding);
      this.actionMenuPosition.set({ top: rect.bottom + 5, left });
    }
  }

  closeActionMenu() {
    this.openActionMenuId.set(null);
    this.actionMenuPosition.set(null);
  }

  hasNoValue(value: string | undefined | null): boolean {
    return !value || !value.trim();
  }

  getStatusClass(status: DeviceStatus): string {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'assigned':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
      case 'maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'retired':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  }

  getStatusLabel(status: DeviceStatus): string {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'assigned':
        return 'Assigné';
      case 'maintenance':
        return 'Maintenance';
      case 'retired':
        return 'Retiré';
    }
  }

  openAddForm() {
    if (!this.isIT()) {
      return;
    }
    this.editingDeviceId.set(null);
    this.formDevice.set({
      name: '',
      type: 'Laptop',
      owner: '',
      email: '',
      status: 'available',
      serialNumber: '',
      maintenanceEnabled: false,
      maintenanceDescription: '',
      maintenanceStartDate: null,
      maintenanceEndDate: null,
      maintenanceFrequency: null,
    });
    this.showAddForm.set(true);
  }

  editDevice(device: Device) {
    if (!this.isIT()) {
      return;
    }
    this.editingDeviceId.set(device.id);
    this.formDevice.set({ ...device });
    this.showAddForm.set(true);
  }

  async saveDevice() {
    const device = this.formDevice();
    if (!device.name) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload: any = {
      name: device.name!,
      type: device.type as string,
      owner: device.owner || 'À définir',
      email: device.email || '',
      status: device.status as DeviceStatus,
      serialNumber: device.serialNumber || `AUTO-${Date.now()}`,
      maintenanceEnabled: device.maintenanceEnabled || false,
      maintenanceDescription: device.maintenanceDescription || '',
      maintenanceStartDate: device.maintenanceStartDate || null,
      maintenanceEndDate: device.maintenanceEndDate || null,
      maintenanceFrequency: device.maintenanceFrequency || null,
    };

    try {
      let deviceId: string;

      if (this.editingDeviceId()) {
        const updatedDevice: any = await firstValueFrom(this.apiService.updateDevice(String(this.editingDeviceId()), payload));
        deviceId = updatedDevice._id || updatedDevice.id || String(this.editingDeviceId());
      } else {
        const createdDevice: any = await firstValueFrom(this.apiService.createDevice(payload));
        deviceId = createdDevice._id || createdDevice.id;
      }

      this.loadDevices();
      this.showAddForm.set(false);
      this.editingDeviceId.set(null);
      this.formDevice.set({
        name: '',
        type: 'Laptop',
        owner: '',
        email: '',
        status: 'available',
        serialNumber: '',
        maintenanceEnabled: false,
        maintenanceDescription: '',
        maintenanceStartDate: null,
        maintenanceEndDate: null,
        maintenanceFrequency: null,
      });
    } catch (err: any) {
      this.error.set(err?.message || 'Impossible de sauvegarder l’appareil.');
    } finally {
      this.loading.set(false);
    }
  }

  cancelForm() {
    this.showAddForm.set(false);
    this.editingDeviceId.set(null);
  }

  deleteDevice(deviceId: string) {
    if (!this.isIT()) {
      return;
    }

    this.apiService.deleteDevice(deviceId).subscribe({
      next: () => this.loadDevices(),
      error: () => this.loadDevices()
    });
  }

  toggleStatus(deviceId: string) {
    if (!this.isIT()) {
      return;
    }

    const device = this.devices().find((item) => item.id === deviceId);
    if (!device) {
      return;
    }

    const nextStatus: DeviceStatus = device.status === 'available' ? 'maintenance' : device.status === 'maintenance' ? 'available' : device.status;
    if (nextStatus === device.status) {
      this.error.set('Ce statut ne peut pas être basculé depuis cette action.');
      return;
    }

    this.error.set(null);
    this.apiService.updateDeviceStatus(deviceId, nextStatus).subscribe({
      next: () => this.loadDevices(),
      error: () => this.error.set("Impossible de mettre à jour le statut de l'appareil.")
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
      this.loadDevices();
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.itemsPerPage));
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  async handleExcelImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.importingDevices.set(true);
    this.importFeedback.set(null);
    this.importFeedbackType.set(null);

    try {
      const result = await firstValueFrom(this.apiService.importDevices(file));
      this.loadDevices();
      this.importFeedback.set(`Import terminé : ${result.success} appareil(s) ajouté(s), ${result.failed} échec(s).`);
      this.importFeedbackType.set('success');
      if (result.errors.length > 0) {
        this.importFeedback.set(this.importFeedback() + '\nErreurs: ' + result.errors.join('\n'));
      }
    } catch (err: any) {
      this.importFeedback.set(err?.message || 'Impossible d\'importer les appareils depuis le fichier.');
      this.importFeedbackType.set('error');
    } finally {
      this.importingDevices.set(false);
      input.value = '';
    }
  }

  exportDevices() {
    this.apiService.exportDevices(this.searchTerm()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'appareils.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.error.set('Impossible d\'exporter la liste des appareils.');
      },
    });
  }

  openTicketModal(device: Device) {
    this.ticketForm.set({
      title: '',
      description: '',
      deviceId: device.id,
      issueType: 'damaged' as IssueType,
      priority: 'medium' as TicketPriority
    });
    this.ticketError.set(null);
    this.showTicketModal.set(true);
    this.closeActionMenu();
  }

  closeTicketModal() {
    this.showTicketModal.set(false);
    this.ticketForm.set({
      title: '',
      description: '',
      deviceId: '',
      issueType: 'damaged' as IssueType,
      priority: 'medium' as TicketPriority
    });
    this.ticketError.set(null);
  }

  async createTicket() {
    const form = this.ticketForm();
    
    if (!form.title || !form.description || !form.deviceId || !form.issueType) {
      this.ticketError.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.ticketLoading.set(true);
    this.ticketError.set(null);

    try {
      await firstValueFrom(this.apiService.createTicket(form));
      this.ticketLoading.set(false);
      this.closeTicketModal();
    } catch (err: any) {
      this.ticketError.set(err.error?.message || 'Failed to create ticket');
      this.ticketLoading.set(false);
    }
  }
}
