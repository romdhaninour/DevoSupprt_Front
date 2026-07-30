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
  owner: string;
  serialNumber: string;
  assignedAt?: string | null;
  location?: string | null;
}

@Component({
  selector: 'app-consultant-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mes appareils</h1>
          <p class="text-gray-600 dark:text-gray-400 text-sm">Consultez les appareils qui vous ont été attribués</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            routerLink="/my-tickets"
            class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
          >
            Mes tickets
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
              </svg>
            </span>
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event); onSearchChange()"
              placeholder="Rechercher par nom, type ou numéro de série..."
              class="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 transition-all duration-200"
            />
            <span *ngIf="searchTerm()" class="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" (click)="searchTerm.set(''); onSearchChange()">
              <svg class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 01-1.414-1.414z" />
              </svg>
            </span>
          </div>
          <button
            type="button"
            (click)="toggleSortOrder()"
            class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-3.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 whitespace-nowrap"
            title="Trier par date de création"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {{ sortOrder() === 'desc' ? 'Récent' : 'Ancien' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex justify-center items-center h-48">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Devices Table -->
      <div *ngIf="!loading()" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="hidden lg:block overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Appareil</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° de série</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigné le</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let device of devices(); let i = index" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ device.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ device.owner }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ device.type }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ device.serialNumber }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ formatAssignedAt(device.assignedAt) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    type="button"
                    (click)="openTicketModal(device)"
                    class="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Signaler
                  </button>
                </td>
              </tr>
              <tr *ngIf="devices().length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center">
                    <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <p class="text-lg font-medium">Aucun appareil attribué</p>
                    <p class="text-sm">Revenez plus tard ou affinez votre recherche</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
          <div *ngFor="let device of devices()" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ device.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ device.type }} &middot; {{ device.serialNumber }}</div>
              </div>
              <button (click)="openTicketModal(device)" class="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </button>
            </div>
          </div>
          <div *ngIf="devices().length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucun appareil attribué
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="totalCount() > 0" class="px-6 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <div class="flex items-center justify-between w-full">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Affichage de {{ (currentPage() - 1) * itemsPerPage() + 1 }} à {{ Math.min(currentPage() * itemsPerPage(), totalCount()) }} sur {{ totalCount() }} appareil(s)
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() === 1"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                </svg>
                <span class="hidden sm:inline">Précédent</span>
              </button>

              <ul class="hidden items-center gap-1 sm:flex">
                <li *ngFor="let page of getPageNumbers()">
                  <button
                    *ngIf="page !== '...'"
                    (click)="goToPage(page)"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200"
                    [ngClass]="{
                      'bg-blue-600 text-white shadow-md shadow-blue-500/30': currentPage() === page,
                      'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700': currentPage() !== page
                    }"
                  >
                    {{ page }}
                  </button>
                  <span *ngIf="page === '...'" class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">…</span>
                </li>
              </ul>

              <button
                (click)="goToPage(currentPage() + 1)"
                [disabled]="currentPage() === totalPages()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span class="hidden sm:inline">Suivant</span>
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket Creation Modal -->
      <app-modal [isOpen]="showTicketModal()" (close)="closeTicketModal()" className="max-w-md mx-4">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Signaler un problème</h2>
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

  displayValue(value: string | null | undefined): string {
    return value?.trim() ? value : 'À définir';
  }

  devices = signal<AssignedDevice[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  role = signal(localStorage.getItem('user_role') || '');
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalCount = signal(0);
  sortOrder = signal<'desc' | 'asc'>('desc');

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

  toggleSortOrder() {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    this.loadAssignedForUser();
  }

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
    this.apiService.getAssignedDevices(page, this.itemsPerPage(), this.searchTerm(), undefined, this.sortOrder()).subscribe({
      next: (response) => {
        this.devices.set(
          response.devices.map((device: any) => ({
            id: device._id || device.id,
            name: device.name || 'Appareil sans nom',
            type: device.type || 'Type non défini',
            owner: device.owner || 'Consultant non défini',
            serialNumber: device.serialNumber || 'N/A',
            location: device.location || 'À définir',
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

