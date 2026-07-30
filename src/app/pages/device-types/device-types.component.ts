import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { firstValueFrom } from 'rxjs';

interface DeviceType {
  _id: string;
  name: string;
  description: string;
  createdAt?: string;
}

@Component({
  selector: 'app-device-types',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './device-types.component.html',
})
export class DeviceTypesComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  deviceTypes = signal<DeviceType[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteModalOpen = signal(false);
  deleteTarget = signal<DeviceType | null>(null);
  saving = signal(false);
  sortOrder = signal<'desc' | 'asc'>('desc');

  formName = signal('');
  formDescription = signal('');

  ngOnInit() {
    this.loadDeviceTypes();
  }

  toggleSortOrder() {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    this.loadDeviceTypes();
  }

  loadDeviceTypes() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getDeviceTypes(this.sortOrder()).subscribe({
      next: (types) => {
        this.deviceTypes.set(types);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les types d\'appareils.');
        this.loading.set(false);
      }
    });
  }

  openAddModal() {
    this.editingId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.showModal.set(true);
  }

  openEditModal(type: DeviceType) {
    this.editingId.set(type._id);
    this.formName.set(type.name);
    this.formDescription.set(type.description);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.saving.set(false);
  }

  async save() {
    const name = this.formName().trim();
    if (!name) return;

    this.saving.set(true);
    this.error.set(null);

    try {
      const payload = { name, description: this.formDescription().trim() };

      if (this.editingId()) {
        await firstValueFrom(this.apiService.updateDeviceType(this.editingId()!, payload));
      } else {
        await firstValueFrom(this.apiService.createDeviceType(payload));
      }

      this.closeModal();
      this.loadDeviceTypes();
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Erreur lors de la sauvegarde.');
      this.saving.set(false);
    }
  }

  openDeleteModal(type: DeviceType) {
    this.deleteTarget.set(type);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.deleteTarget.set(null);
    this.deleteModalOpen.set(false);
  }

  async confirmDelete() {
    const target = this.deleteTarget();
    if (!target) return;

    try {
      await firstValueFrom(this.apiService.deleteDeviceType(target._id));
      this.closeDeleteModal();
      this.loadDeviceTypes();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Erreur lors de la suppression.');
      this.closeDeleteModal();
    }
  }
}
