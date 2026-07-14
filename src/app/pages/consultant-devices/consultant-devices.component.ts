import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { IssueType, TicketPriority } from '../../models/ticket.model';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

interface AssignedDevice {
  id: string;
  name: string;
  type: string;
  department: string;
  owner: string;
  location: string;
  serialNumber: string;
  assignedAt?: string | null;
}

@Component({
  selector: 'app-consultant-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mes appareils</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Consultez les appareils qui vous ont été attribués et trouvez-les rapidement.</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p class="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Total</p>
              <p class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{{ totalCount() }}</p>
            </div>
            <button
              type="button"
              routerLink="/my-tickets"
              class="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Mes tickets
            </button>
          </div>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div class="sm:col-span-2">
            <label class="sr-only" for="device-search">Rechercher un appareil</label>
            <div class="relative">
              <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM10 16a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
              </svg>
              <input
                id="device-search"
                type="search"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event); onSearchChange()"
                placeholder="Rechercher par nom, type, service ou N° de série"
                class="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>

        </div>
      </div>

      <div *ngIf="loading()" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p class="text-sm text-gray-500 dark:text-gray-400">Chargement des appareils...</p>
      </div>


      <div *ngIf="!loading() && devices().length === 0" class="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
        <p class="font-medium text-gray-900 dark:text-white">Aucun appareil attribué pour le moment.</p>
        <p class="mt-2">Revenez plus tard ou affinez votre recherche.</p>
      </div>

      <div *ngIf="!loading() && devices().length > 0" class="grid gap-4 lg:grid-cols-2">
        <article *ngFor="let device of devices()" class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
          <div class="flex flex-col gap-4 p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">{{ device.type || 'Type inconnu' }}</p>
                <h2 class="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{{ device.name }}</h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ displayValue(device.department) }}</p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-3xl bg-gray-50 p-4 text-sm dark:bg-gray-950/40">
                <p class="text-xs text-gray-500 dark:text-gray-400">N° de série</p>
                <p class="mt-2 font-medium text-gray-900 dark:text-white">{{ displayValue(device.serialNumber) }}</p>
              </div>
              <div class="rounded-3xl bg-gray-50 p-4 text-sm dark:bg-gray-950/40">
                <p class="text-xs text-gray-500 dark:text-gray-400">Date d'assignation</p>
                <p class="mt-2 font-medium text-gray-900 dark:text-white">{{ formatAssignedAt(device.assignedAt) }}</p>
              </div>
            </div>

            <div class="mt-4">
              <button
                type="button"
                (click)="openTicketModal(device)"
                class="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Signaler un problème
              </button>
            </div>
          </div>
        </article>
      </div>

      <div *ngIf="!loading() && totalPages() > 1" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="text-sm text-gray-600 dark:text-gray-400">Page {{ currentPage() }} sur {{ totalPages() }}</div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)"
          >
            Précédent
          </button>
          <ng-container *ngFor="let page of getPageNumbers()">
            <button
              *ngIf="page !== '...'"
              type="button"
              class="rounded-2xl border px-3 py-2 text-sm font-medium transition border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
              [class.border-sky-600]="currentPage() === page"
              [class.bg-sky-50]="currentPage() === page"
              [class.text-sky-700]="currentPage() === page"
              [class.dark\:border-sky-500]="currentPage() === page"
              [class.dark\:bg-sky-950\/40]="currentPage() === page"
              [class.dark\:text-sky-300]="currentPage() === page"
              [disabled]="currentPage() === page"
              (click)="goToPage(page)"
            >
              {{ page }}
            </button>
            <span *ngIf="page === '...'" class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">…</span>
          </ng-container>
          <button
            type="button"
            class="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(currentPage() + 1)"
          >
            Suivant
          </button>
        </div>
      </div>

      <!-- Ticket Creation Modal -->
      <app-modal [isOpen]="showTicketModal()" (close)="closeTicketModal()" className="max-w-md mx-4">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Signaler un problème</h2>
          @if (ticketError()) {
            <div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
              {{ ticketError() }}
            </div>
          }
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
              <input type="text" [(ngModel)]="ticketForm().title" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Titre du problème">
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea [(ngModel)]="ticketForm().description" rows="2" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Décrivez le problème"></textarea>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type de problème</label>
              <select [(ngModel)]="ticketForm().issueType" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="damaged">Endommagé</option>
                <option value="destroyed">Détruit</option>
                <option value="malfunction">Dysfonctionnement</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priorité</label>
              <select [(ngModel)]="ticketForm().priority" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="closeTicketModal()" class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Annuler</button>
              <button type="button" (click)="createTicket()" [disabled]="ticketLoading()" class="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{{ ticketLoading() ? 'Création...' : 'Créer' }}</button>
            </div>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class ConsultantDevicesComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  // Expose Math for template usage
  protected readonly Math = Math;

  devices = signal<AssignedDevice[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  role = signal(localStorage.getItem('user_role') || '');
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalCount = signal(0);

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

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalCount() / this.itemsPerPage()));
  });

  onSearchChange() {
    this.currentPage.set(1);
    this.loadAssignedForUser(1);
  }

  private readonly dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  ngOnInit() {
    this.loadAssignedForUser();
  }

  loadAssignedForUser(page: number = 1) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.apiService.getAssignedDevices(page, this.itemsPerPage(), this.searchTerm()).subscribe({
      next: (response) => {
        this.devices.set(
          response.devices.map((device: any) => ({
            id: device._id || device.id,
            name: device.name || 'Appareil sans nom',
            type: device.type || 'Type non défini',
            department: device.department || 'Service non précisé',
            owner: device.owner || 'Consultant non défini',
            location: device.location || 'À définir',
            serialNumber: device.serialNumber || 'N/A',
            assignedAt: device.assignedAt || null,
          }))
        );
        this.totalCount.set(response.total ?? response.devices.length);
        this.currentPage.set(response.page ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.devices.set([]);
        this.totalCount.set(0);
        this.loading.set(false);
      },
    });
  }

  goToPage(page: string | number) {
    const requestedPage = typeof page === 'string' ? Number(page) : page;
    if (Number.isNaN(requestedPage)) {
      return;
    }

    const maxPage = this.totalPages();
    if (requestedPage >= 1 && requestedPage <= maxPage) {
      this.loadAssignedForUser(requestedPage);
    }
  }

  getPageNumbers() {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  }

  formatAssignedAt(assignedAt?: string | null) {
    if (!assignedAt) {
      return 'À définir';
    }

    const date = new Date(assignedAt);
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }

    return this.dateFormatter.format(date);
  }

  displayValue(value?: string | null) {
    return value && value.trim() ? value : 'À définir';
  }

  openTicketModal(device: AssignedDevice) {
    this.ticketForm.set({
      title: '',
      description: '',
      deviceId: device.id,
      issueType: 'damaged' as IssueType,
      priority: 'medium' as TicketPriority
    });
    this.ticketError.set(null);
    this.showTicketModal.set(true);
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

