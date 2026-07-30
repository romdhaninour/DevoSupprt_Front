import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

const MAINTENANCE_FREQ_LABELS: Record<string, string> = {
  '1month': '1 mois',
  '3months': '3 mois',
  '6months': '6 mois',
  '9months': '9 mois',
  '1year': '1 an',
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  available: {
    label: 'Disponible',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  },
  assigned: {
    label: 'Assigné',
    class: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  },
  maintenance: {
    label: 'Maintenance',
    class: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  retired: {
    label: 'Hors service',
    class: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  },
};

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './device-detail.component.html',
})
export class DeviceDetailComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  device = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

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

  goBack() {
    this.router.navigate(['/device-management']);
  }

  getStatusInfo(status: string): { label: string; class: string } {
    return STATUS_MAP[status] || { label: status, class: 'bg-gray-50 text-gray-700 border-gray-200' };
  }

  getFrequencyLabel(freq: string | null): string {
    if (!freq) return '—';
    return MAINTENANCE_FREQ_LABELS[freq] || freq;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getDaysUntil(dateString: string | null): number | null {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getNextMaintenanceText(): string {
    const d = this.device();
    if (!d?.nextMaintenanceDate) return '—';
    const days = this.getDaysUntil(d.nextMaintenanceDate);
    if (days === null) return '—';
    if (days < 0) return `En retard (${Math.abs(days)}j)`;
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Demain';
    return `Dans ${days} jours`;
  }

  getNextMaintenanceClass(): string {
    const d = this.device();
    if (!d?.nextMaintenanceDate) return '';
    const days = this.getDaysUntil(d.nextMaintenanceDate);
    if (days === null) return '';
    if (days < 0) return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
    if (days === 0) return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    if (days <= 7) return 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    if (days <= 30) return 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  }

  getPhotoUrl(photo: string): string {
    if (photo.startsWith('http')) return photo;
    const d = this.device();
    const id = d?._id || d?.id;
    return `${environment.apiUrl}/devices/${id}/photos/${photo}`;
  }
}
