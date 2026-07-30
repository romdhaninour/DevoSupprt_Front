import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';

interface DeviceOption {
  id: string;
  name: string;
  status: string;
  assignedTo?: string | null;
  assignedAt?: string | null;
}

@Component({
  selector: 'app-device-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Allocation des appareils</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Attribuer un appareil disponible à un consultant ou le restituer ensuite.</p>
      </div>

      <div *ngIf="message()" class="rounded-xl border px-4 py-3 text-sm" [ngClass]="messageType() === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300'">
        {{ message() }}
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Appareil disponible</label>
            <select [ngModel]="selectedDeviceId()" (ngModelChange)="selectedDeviceId.set($event)" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Choisir un appareil</option>
              <option *ngFor="let device of devices()" [value]="device.id">{{ device.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Consultant</label>
            <select [ngModel]="selectedConsultantId()" (ngModelChange)="selectedConsultantId.set($event)" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Choisir un consultant</option>
              <option *ngFor="let consultant of consultants()" [value]="consultant._id">{{ consultant.nom }} {{ consultant.prenom }} ({{ consultant.email }})</option>
            </select>
          </div>
        </div>
        <button type="button" (click)="assignDevice()" [disabled]="loading()" class="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {{ loading() ? 'Traitement...' : 'Attribuer' }}
        </button>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Appareils attribués</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ assignedDevices().length }} en cours</span>
        </div>
        <div *ngIf="assignedDevices().length === 0" class="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Aucun appareil n’est actuellement attribué.
        </div>
        <div *ngIf="assignedDevices().length > 0" class="space-y-3">
          <div *ngFor="let device of assignedDevices()" class="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between dark:border-gray-700">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ device.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Assigné à : {{ device.assignedTo || 'Non renseigné' }}</p>
            </div>
            <button type="button" (click)="returnDevice(device.id)" class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              Restituer
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeviceAllocationComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  devices = signal<DeviceOption[]>([]);
  consultants = signal<User[]>([]);
  assignedDevices = signal<DeviceOption[]>([]);
  selectedDeviceId = signal('');
  selectedConsultantId = signal('');
  loading = signal(false);
  message = signal<string | null>(null);
  messageType = signal<'success' | 'error' | null>(null);

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.apiService.getDevices(1, 100).subscribe({
      next: (response) => {
        const mappedDevices = response.devices.map((device: any) => ({
          id: device._id,
          name: device.name,
          status: device.status,
          assignedTo: device.assignedTo || null,
          assignedAt: device.assignedAt || null,
        }));
        this.devices.set(mappedDevices.filter((device) => device.status === 'available'));
        this.assignedDevices.set(mappedDevices.filter((device) => device.status === 'assigned'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.setMessage('Impossible de charger la liste des appareils.', 'error');
      }
    });

    this.apiService.getConsultants().subscribe({
      next: (users) => this.consultants.set(users),
      error: () => this.consultants.set([]),
    });
  }

  assignDevice() {
    const deviceId = this.selectedDeviceId();
    const consultantId = this.selectedConsultantId();

    if (!deviceId || !consultantId) {
      this.setMessage('Sélectionnez un appareil et un consultant.', 'error');
      return;
    }

    this.loading.set(true);
    this.apiService.allocateDevice(deviceId, consultantId).subscribe({
      next: () => {
        this.selectedDeviceId.set('');
        this.selectedConsultantId.set('');
        this.loadData();
        this.setMessage('Appareil attribué avec succès.', 'success');
      },
      error: () => {
        this.loading.set(false);
        this.setMessage("Impossible d'attribuer cet appareil.", 'error');
      }
    });
  }

  returnDevice(deviceId: string) {
    this.loading.set(true);
    this.apiService.returnDevice(deviceId).subscribe({
      next: () => {
        this.loadData();
        this.setMessage('Appareil restitué avec succès.', 'success');
      },
      error: () => {
        this.loading.set(false);
        this.setMessage('Impossible de restituer cet appareil.', 'error');
      }
    });
  }

  private setMessage(message: string, type: 'success' | 'error') {
    this.message.set(message);
    this.messageType.set(type);
  }
}
