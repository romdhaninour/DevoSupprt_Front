import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import flatpickr from 'flatpickr';
import { French } from 'flatpickr/dist/l10n/fr';


const MAINTENANCE_FREQ_LABELS: Record<string, string> = {
  '1month': '1 mois',
  '3months': '3 mois',
  '6months': '6 mois',
  '9months': '9 mois',
  '1year': '1 an',
};

interface MaintenanceDevice {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  maintenanceDescription?: string;
  maintenanceEndDate?: string;
  lastMaintenanceDate?: string;
  maintenanceStartDate?: string;
  maintenanceFrequency?: string;
  nextMaintenanceDate?: string;
}

@Component({
  selector: 'app-device-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, FormField],
  templateUrl: './device-maintenance.component.html',
})
export class DeviceMaintenanceComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  devices = signal<MaintenanceDevice[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  searchTerm = signal('');
  filterFrequency = signal('all');

  openActionMenuId = signal<string | null>(null);
  actionMenuPosition = signal<{ top: number; left: number } | null>(null);

  showEditModal = signal(false);
  editingDevice = signal<MaintenanceDevice | null>(null);
  editModel = signal({ description: '', endDate: '', frequency: '' });
  editForm = form(this.editModel);
  editLoading = signal(false);
  editError = signal<string | null>(null);
  private editEndFlatpickr: flatpickr.Instance | null = null;

  showConfirmModal = signal(false);
  confirmingDevice = signal<MaintenanceDevice | null>(null);
  confirmLoading = signal(false);

  currentPage = 1;
  itemsPerPage = 6;

  filteredDevices = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const freq = this.filterFrequency();
    let result = this.devices();
    if (term) {
      result = result.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.type.toLowerCase().includes(term) ||
        d.serialNumber.toLowerCase().includes(term) ||
        (d.maintenanceDescription || '').toLowerCase().includes(term)
      );
    }
    if (freq !== 'all') {
      result = result.filter(d => d.maintenanceFrequency === freq);
    }
    return result.sort((a, b) => {
      const dateA = a.nextMaintenanceDate || a.maintenanceEndDate;
      const dateB = b.nextMaintenanceDate || b.maintenanceEndDate;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  });

  get totalPages(): number {
    return Math.ceil(this.filteredDevices().length / this.itemsPerPage);
  }

  get paginatedDevices(): MaintenanceDevice[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredDevices().slice(start, start + this.itemsPerPage);
  }

  get totalDevices(): number { return this.devices().length; }
  get overdueCount(): number { return this.devices().filter(d => this.getMaintenanceStatus(d).startsWith('En retard')).length; }
  get upcomingCount(): number { return this.devices().filter(d => !this.getMaintenanceStatus(d).startsWith('En retard') && this.getMaintenanceStatus(d) !== 'Non configuré').length; }

  getPaginatedRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredDevices().length);
    return `${start} à ${end} sur ${this.filteredDevices().length}`;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  updateSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.currentPage = 1;
  }

  updateFrequencyFilter(freq: string) {
    this.filterFrequency.set(freq);
    this.currentPage = 1;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.openActionMenuId() && !target.closest('.action-menu-container')) {
      this.openActionMenuId.set(null);
    }
  }

  ngOnInit() {
    this.loadMaintenanceDevices();
  }

  loadMaintenanceDevices() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getMaintenanceDevices().subscribe({
      next: (data) => {
        this.devices.set(data.map((device: any) => ({
          id: String(device._id || device.id),
          name: device.name,
          type: device.type,
          serialNumber: device.serialNumber,
          maintenanceDescription: device.maintenanceDescription,
          maintenanceEndDate: device.maintenanceEndDate,
          lastMaintenanceDate: device.lastMaintenanceDate,
          maintenanceStartDate: device.maintenanceStartDate,
          maintenanceFrequency: device.maintenanceFrequency,
          nextMaintenanceDate: device.nextMaintenanceDate,
        })));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les appareils en maintenance.');
        this.loading.set(false);
      },
    });
  }

  toggleActionMenu(deviceId: string, event: MouseEvent) {
    const current = this.openActionMenuId();
    if (current === deviceId) {
      this.openActionMenuId.set(null);
      this.actionMenuPosition.set(null);
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 120;
    const padding = 12;
    const left = Math.min(Math.max(rect.right - menuWidth, padding), window.innerWidth - menuWidth - padding);
    const hasSpaceBelow = window.innerHeight - rect.bottom > menuHeight + padding;
    const desiredTop = hasSpaceBelow ? rect.bottom : rect.top - menuHeight;
    const minTop = padding;
    const maxTop = window.innerHeight - menuHeight - padding;
    const top = Math.min(Math.max(desiredTop, minTop), maxTop);

    this.actionMenuPosition.set({ top, left });
    this.openActionMenuId.set(deviceId);
  }

  navigateToDetail(deviceId: string) {
    this.router.navigate(['/device-maintenance', deviceId]);
  }

  getMaintenanceStatus(device: MaintenanceDevice): string {
    const dateToCheck = device.nextMaintenanceDate || device.maintenanceEndDate;
    if (!dateToCheck) return 'Non configuré';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `En retard (${Math.abs(diffDays)}j)`;
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays <= 7) return `Dans ${diffDays} jours`;
    if (diffDays <= 30) return `Dans ${diffDays} jours`;
    return `Dans ${diffDays} jours`;
  }

  getMaintenanceStatusClass(status: string): string {
    if (status.startsWith('En retard')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
    }
    if (status === "Aujourd'hui" || status === 'Demain') {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    }
    if (status.startsWith('Dans ') && status.endsWith(' jours')) {
      const days = parseInt(status.match(/\d+/)?.[0] || '0', 10);
      if (days <= 7) return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      if (days <= 30) return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    }
    return 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }

  getFrequencyLabel(freq: string | undefined): string {
    if (!freq) return '—';
    return MAINTENANCE_FREQ_LABELS[freq] || freq;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  openEditModal(device: MaintenanceDevice) {
    this.editingDevice.set(device);
    this.editModel.set({
      description: device.maintenanceDescription || '',
      endDate: device.maintenanceEndDate ? new Date(device.maintenanceEndDate).toISOString().split('T')[0] : '',
      frequency: device.maintenanceFrequency || '',
    });
    this.editError.set(null);
    this.showEditModal.set(true);
    this.openActionMenuId.set(null);

    setTimeout(() => {
      const endInput = document.querySelector('#listEditEndDateInput') as HTMLInputElement;
      if (endInput) {
        if (this.editEndFlatpickr) this.editEndFlatpickr.destroy();
        this.editEndFlatpickr = flatpickr(endInput, {
          locale: French, dateFormat: 'Y-m-d', altInput: false, allowInput: false,
          clickOpens: true, disableMobile: true, appendTo: document.body,
          defaultDate: this.editModel().endDate || undefined,
          onChange: (selectedDates) => {
            if (selectedDates.length > 0) {
              const formatted = selectedDates[0].toISOString().split('T')[0];
              this.editModel.update(m => ({ ...m, endDate: formatted }));
            }
          },
        });
      }
    }, 150);
  }

  closeEditModal() {
    if (this.editEndFlatpickr) { this.editEndFlatpickr.destroy(); this.editEndFlatpickr = null; }
    this.showEditModal.set(false);
    this.editingDevice.set(null);
    this.editError.set(null);
  }

  async saveEdit() {
    const device = this.editingDevice();
    if (!device) return;

    this.editLoading.set(true);
    this.editError.set(null);
    try {
      const model = this.editModel();
      await firstValueFrom(this.apiService.updateDeviceMaintenance(device.id, {
        maintenanceDescription: model.description,
        maintenanceEndDate: model.endDate || undefined,
        maintenanceFrequency: model.frequency || undefined,
      }));
      this.closeEditModal();
      this.loadMaintenanceDevices();
    } catch (err: any) {
      this.editError.set(err?.error?.message || 'Échec de la mise à jour');
    } finally {
      this.editLoading.set(false);
    }
  }

  openConfirmModal(device: MaintenanceDevice) {
    this.confirmingDevice.set(device);
    this.showConfirmModal.set(true);
    this.openActionMenuId.set(null);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.confirmingDevice.set(null);
    this.confirmLoading.set(false);
  }

  async confirmMarkAsMaintained() {
    const device = this.confirmingDevice();
    if (!device) return;
    this.confirmLoading.set(true);
    try {
      await firstValueFrom(this.apiService.markDeviceAsMaintained(device.id));
      this.closeConfirmModal();
      this.loadMaintenanceDevices();
    } catch (err: any) {
      this.error.set(err?.message || 'Impossible de marquer comme effectué.');
      this.closeConfirmModal();
    }
  }
}
