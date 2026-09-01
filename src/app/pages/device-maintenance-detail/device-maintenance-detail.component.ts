import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-device-maintenance-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './device-maintenance-detail.component.html',
})
export class DeviceMaintenanceDetailComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  device = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  showEditModal = signal(false);
  editDescription = '';
  editEndDate = '';
  editFrequency = '';
  editLoading = signal(false);
  editError = signal<string | null>(null);

  private editEndFlatpickr: flatpickr.Instance | null = null;

  showConfirmModal = signal(false);
  confirmLoading = signal(false);
  confirmDate = signal('');
  private confirmFlatpickr: flatpickr.Instance | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDevice(id);
    } else {
      this.error.set('ID introuvable');
      this.loading.set(false);
    }
  }

  loadDevice(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getDeviceById(id).subscribe({
      next: (device) => {
        this.device.set(device);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Appareil introuvable');
        this.loading.set(false);
      },
    });
  }

  async markAsMaintained() {
    const d = this.device();
    if (!d) return;
    this.confirmLoading.set(true);
    try {
      await firstValueFrom(this.apiService.markDeviceAsMaintained(d._id || d.id, this.confirmDate() || undefined));
      this.closeConfirmModal();
      this.loadDevice(d._id || d.id);
    } catch (err: any) {
      this.error.set(err?.message || 'Impossible de marquer comme effectué.');
      this.closeConfirmModal();
    } finally {
      this.confirmLoading.set(false);
    }
  }

  openConfirmModal() {
    this.confirmDate.set(this.toDateString(new Date()));
    this.showConfirmModal.set(true);

    setTimeout(() => {
      const input = document.querySelector('#detailConfirmDateInput') as HTMLInputElement;
      if (input) {
        if (this.confirmFlatpickr) this.confirmFlatpickr.destroy();
        this.confirmFlatpickr = flatpickr(input, {
          locale: French, dateFormat: 'Y-m-d', altInput: false, allowInput: false,
          clickOpens: true, disableMobile: true, appendTo: document.body,
          defaultDate: this.confirmDate() || undefined,
          onChange: (selectedDates) => {
            if (selectedDates.length > 0) this.confirmDate.set(this.toDateString(selectedDates[0]));
          },
        });
      }
    }, 150);
  }

  closeConfirmModal() {
    if (this.confirmFlatpickr) { this.confirmFlatpickr.destroy(); this.confirmFlatpickr = null; }
    this.showConfirmModal.set(false);
    this.confirmLoading.set(false);
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  openEditModal() {
    const d = this.device();
    if (!d) return;
    this.editDescription = d.maintenanceDescription || '';
    this.editEndDate = d.maintenanceEndDate ? new Date(d.maintenanceEndDate).toISOString().split('T')[0] : '';
    this.editFrequency = d.maintenanceFrequency || '';
    this.editError.set(null);
    this.showEditModal.set(true);

    setTimeout(() => {
      const endInput = document.querySelector('#editEndDateInput') as HTMLInputElement;
      if (endInput) {
        if (this.editEndFlatpickr) this.editEndFlatpickr.destroy();
        this.editEndFlatpickr = flatpickr(endInput, {
          locale: French, dateFormat: 'Y-m-d', altInput: false, allowInput: false,
          clickOpens: true, disableMobile: true, appendTo: document.body,
          defaultDate: this.editEndDate || undefined,
          onChange: (selectedDates) => {
            if (selectedDates.length > 0) this.editEndDate = selectedDates[0].toISOString().split('T')[0];
          },
        });
      }
    }, 150);
  }

  closeEditModal() {
    if (this.editEndFlatpickr) { this.editEndFlatpickr.destroy(); this.editEndFlatpickr = null; }
    this.showEditModal.set(false);
    this.editError.set(null);
  }

  onFrequencyChange(frequency: string) {
    const d = this.device();
    if (!frequency || !d) return;
    const baseString = d.maintenanceStartDate || d.nextMaintenanceDate || d.maintenanceEndDate;
    if (!baseString) return;
    const baseDate = new Date(baseString);
    const months = this.getFreqMonths(frequency);
    if (months < 1) return;
    baseDate.setMonth(baseDate.getMonth() + months);
    this.editFrequency = frequency;
    this.editEndDate = this.toDateString(baseDate);
    if (this.editEndFlatpickr) {
      this.editEndFlatpickr.setDate(this.editEndDate, true);
    }
  }

  private getFreqMonths(freq: string): number {
    switch (freq) {
      case '1month': return 1;
      case '3months': return 3;
      case '6months': return 6;
      case '9months': return 9;
      case '1year': return 12;
      default: return 0;
    }
  }

  async saveEdit() {
    const d = this.device();
    if (!d) return;

    this.editLoading.set(true);
    this.editError.set(null);
    try {
      await firstValueFrom(this.apiService.updateDeviceMaintenance(d._id || d.id, {
        maintenanceDescription: this.editDescription,
        maintenanceEndDate: this.editEndDate || undefined,
        maintenanceFrequency: this.editFrequency || undefined,
      }));
      this.closeEditModal();
      this.loadDevice(d._id || d.id);
    } catch (err: any) {
      this.editError.set(err?.error?.message || 'Échec de la mise à jour');
    } finally {
      this.editLoading.set(false);
    }
  }

  getMaintenanceStatus(): string {
    const d = this.device();
    if (!d?.maintenanceEndDate) return 'Non configuré';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(d.maintenanceEndDate);
    endDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'En retard';
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays <= 7) return 'Cette semaine';
    if (diffDays <= 30) return 'Ce mois';
    return 'À venir';
  }

  getMaintenanceStatusClass(): string {
    switch (this.getMaintenanceStatus()) {
      case 'En retard':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
      case "Aujourd'hui":
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'Cette semaine':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      case 'Ce mois':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    }
  }

  getFrequencyLabel(freq: string): string {
    return MAINTENANCE_FREQ_LABELS[freq] || freq || '—';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('fr-FR');
  }

  getDaysUntilMaintenance(): number | null {
    const d = this.device();
    if (!d?.maintenanceEndDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(d.maintenanceEndDate);
    endDate.setHours(0, 0, 0, 0);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
