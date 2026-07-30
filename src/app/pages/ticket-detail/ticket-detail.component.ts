import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  IssueType,
  ResolutionType,
  UpdateTicketStatusDto,
} from '../../models/ticket.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Back button -->
      <div>
        <a
          [routerLink]="isMyTicketsView ? '/my-tickets' : '/tickets'"
          class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {{ isMyTicketsView ? 'Retour à mes tickets' : 'Retour aux tickets' }}
        </a>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex items-center justify-center py-20">
        <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>

      <!-- Error -->
      <div *ngIf="error()" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
        {{ error() }}
      </div>

      <!-- Ticket Detail -->
      <div *ngIf="!loading() && !error() && ticket() as t" class="space-y-6">
        <!-- Header Card -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span [class]="'inline-flex rounded-full border px-3 py-1 text-xs font-semibold ' + getStatusClass(t.status)">
                  {{ getStatusLabel(t.status) }}
                </span>
                <span [class]="'inline-flex rounded-full border px-3 py-1 text-xs font-semibold ' + getPriorityClass(t.priority)">
                  {{ getPriorityLabel(t.priority) }}
                </span>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t.title }}</h1>
              <p class="max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ t.description }}</p>
            </div>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <!-- LEFT: Key Information -->
          <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Informations clés</h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Statut</p>
                <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ getStatusLabel(t.status) }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Priorité</p>
                <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ getPriorityLabel(t.priority) }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Type de problème</p>
                <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ getIssueTypeLabel(t.issueType) }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Appareil</p>
                <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ t.device?.name || 'N/A' }}</p>
                <p *ngIf="t.device?.type" class="text-xs text-gray-500 dark:text-gray-400">{{ t.device.type }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Créé par</p>
                <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ t.createdBy?.prenom }} {{ t.createdBy?.nom }}</p>
                <p *ngIf="t.createdBy?.email" class="text-xs text-gray-500 dark:text-gray-400">{{ t.createdBy.email }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Créé le</p>
                <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(t.createdAt) }}</p>
              </div>
            </div>
            <div *ngIf="t.resolution || t.resolvedAt" class="mt-4 space-y-2">
              <div *ngIf="t.resolution" class="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Résolution : {{ getResolutionLabel(t.resolution) }}
              </div>
              <div *ngIf="t.resolvedAt" class="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Résolu le : {{ formatDate(t.resolvedAt) }}
              </div>
            </div>
          </div>

          <!-- RIGHT: Tracking & Management -->
          <div class="space-y-4">
            <!-- Tracking -->
            <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Suivi</h2>
              <div class="mt-4 space-y-3">
                <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
                  <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(t.updatedAt || t.createdAt) }}</p>
                </div>
                <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Assigné à</p>
                  <p *ngIf="t.assignedTo" class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ t.assignedTo.prenom }} {{ t.assignedTo.nom }}</p>
                  <p *ngIf="!t.assignedTo" class="mt-1 text-sm italic text-gray-400 dark:text-gray-500">Non assigné</p>
                </div>
              </div>
            </div>

            <!-- IT Management Actions -->
            <div *ngIf="isIT" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Gestion du ticket</h2>
              <div class="mt-4 space-y-4">
                <!-- Change Status -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Changer le statut</label>
                  <div *ngIf="statusLoading()" class="text-sm text-gray-500 dark:text-gray-400">Mise à jour en cours...</div>
                  <div *ngIf="!statusLoading()" class="flex flex-wrap gap-2">
                    <button
                      (click)="updateTicketStatus(TicketStatus.OPEN)"
                      [disabled]="t.status === TicketStatus.OPEN"
                      class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    >
                      Nouveau
                    </button>
                    <button
                      (click)="updateTicketStatus(TicketStatus.IN_PROGRESS)"
                      [disabled]="t.status === TicketStatus.IN_PROGRESS"
                      class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
                    >
                      En cours
                    </button>
                    <button
                      (click)="showResolutionChoice.set(true)"
                      [disabled]="t.status === TicketStatus.RESOLVED"
                      class="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
                    >
                      Résolu
                    </button>
                  </div>
                  <div *ngIf="showResolutionChoice()" class="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-900/20">
                    <p class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Comment a-t-il été résolu ?</p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        (click)="updateTicketStatus(TicketStatus.RESOLVED, ResolutionType.REPAIR); showResolutionChoice.set(false)"
                        class="rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-700 dark:bg-gray-800 dark:text-violet-300"
                      >
                        Réparé
                      </button>
                      <button
                        (click)="updateTicketStatus(TicketStatus.RESOLVED, ResolutionType.REPLACE); showResolutionChoice.set(false)"
                        class="rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-700 dark:bg-gray-800 dark:text-violet-300"
                      >
                        Remplacé
                      </button>
                      <button
                        (click)="showResolutionChoice.set(false)"
                        class="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Assign -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Assigner à</label>
                  <select
                    (change)="onAssignChange($event)"
                    [disabled]="assignLoading()"
                    class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Non assigné</option>
                    <option *ngFor="let staff of itStaff()" [value]="staff._id" [selected]="t.assignedTo?._id === staff._id">
                      {{ getStaffDisplayName(staff) }}
                    </option>
                  </select>
                </div>

                <!-- Delete -->
                <button
                  (click)="deleteTicket()"
                  [disabled]="deleteLoading()"
                  class="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                >
                  {{ deleteLoading() ? 'Suppression...' : 'Supprimer ce ticket' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            Commentaires
            <span *ngIf="t.comments?.length" class="ml-1 text-gray-400 dark:text-gray-500">({{ t.comments.length }})</span>
          </h2>
          <div class="mt-4 space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
            <div *ngFor="let comment of t.comments" class="flex gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
                {{ comment.author?.prenom?.charAt(0) || '?' }}{{ comment.author?.nom?.charAt(0) || '' }}
              </div>
              <div class="flex-1 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ comment.author?.prenom }} {{ comment.author?.nom }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ comment.text }}</p>
              </div>
            </div>
            <div *ngIf="!t.comments?.length" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucun commentaire pour le moment
            </div>
          </div>
          <div class="mt-4 flex gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-500 to-gray-600 text-sm font-semibold text-white">
              {{ getCurrentUserInitials() }}
            </div>
            <input
              [ngModel]="newComment()"
              (ngModelChange)="newComment.set($event)"
              type="text"
              placeholder="Ajouter un commentaire..."
              class="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              (keyup.enter)="addComment()"
              [disabled]="commentLoading()"
            />
            <button
              (click)="addComment()"
              [disabled]="commentLoading() || !newComment().trim()"
              class="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {{ commentLoading() ? '...' : 'Envoyer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TicketDetailComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly TicketStatus = TicketStatus;
  readonly TicketPriority = TicketPriority;
  readonly IssueType = IssueType;
  readonly ResolutionType = ResolutionType;

  ticket = signal<Ticket | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  itStaff = signal<User[]>([]);
  isIT = false;
  isMyTicketsView = false;

  newComment = signal('');
  commentLoading = signal(false);
  statusLoading = signal(false);
  assignLoading = signal(false);
  deleteLoading = signal(false);
  showResolutionChoice = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isMyTicketsView = this.router.url.startsWith('/my-tickets');
    this.isIT = ['IT', 'ADMIN'].includes(localStorage.getItem('user_role') || '');

    if (id) {
      this.loadTicket(id);
      if (this.isIT) {
        this.loadITStaff();
      }
    } else {
      this.error.set('ID du ticket introuvable');
      this.loading.set(false);
    }
  }

  loadTicket(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Ticket introuvable ou accès refusé');
        this.loading.set(false);
      },
    });
  }

  loadITStaff() {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.itStaff.set(users.filter(u => u.role === 'IT' || u.role === 'ADMIN'));
      },
      error: () => this.itStaff.set([]),
    });
  }

  async updateTicketStatus(status: TicketStatus, resolution?: ResolutionType) {
    const t = this.ticket();
    if (!t) return;

    this.statusLoading.set(true);
    try {
      const updateData: UpdateTicketStatusDto = { status };
      if (resolution) updateData.resolution = resolution;
      const updated = await firstValueFrom(this.apiService.updateTicketStatus(t._id, updateData));
      this.ticket.set(updated);
      this.showResolutionChoice.set(false);
    } catch {
      this.error.set('Échec de la mise à jour du statut');
    } finally {
      this.statusLoading.set(false);
    }
  }

  async assignTicket(userId: string) {
    const t = this.ticket();
    if (!t) return;

    this.assignLoading.set(true);
    try {
      const updated = await firstValueFrom(this.apiService.assignTicket(t._id, { assignedTo: userId }));
      this.ticket.set(updated);
    } catch {
      this.error.set('Échec de l\'assignation');
    } finally {
      this.assignLoading.set(false);
    }
  }

  onAssignChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.assignTicket(value);
  }

  async addComment() {
    const t = this.ticket();
    const text = this.newComment();
    if (!t || !text.trim()) return;

    this.commentLoading.set(true);
    try {
      const updated = await firstValueFrom(this.apiService.addTicketComment(t._id, { text }));
      this.ticket.set(updated);
      this.newComment.set('');
    } catch {
      this.error.set('Échec de l\'ajout du commentaire');
    } finally {
      this.commentLoading.set(false);
    }
  }

  async deleteTicket() {
    const t = this.ticket();
    if (!t) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.')) return;

    this.deleteLoading.set(true);
    try {
      await firstValueFrom(this.apiService.deleteTicket(t._id));
      this.router.navigate([this.isMyTicketsView ? '/my-tickets' : '/tickets']);
    } catch {
      this.error.set('Échec de la suppression');
    } finally {
      this.deleteLoading.set(false);
    }
  }

  getCurrentUserInitials(): string {
    const userJson = localStorage.getItem('user');
    if (!userJson) return '?';
    try {
      const user = JSON.parse(userJson);
      return ((user.prenom || '').charAt(0) + (user.nom || '').charAt(0)).toUpperCase();
    } catch {
      return '?';
    }
  }

  getStaffDisplayName(staff: User): string {
    const fullName = `${staff.prenom || ''} ${staff.nom || ''}`.trim();
    return fullName.length > 1 ? fullName : staff.email || 'Inconnu';
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
    const labels: Record<string, string> = {
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
    const labels: Record<string, string> = {
      [IssueType.DAMAGED]: 'Endommagé',
      [IssueType.DESTROYED]: 'Détruit',
      [IssueType.MALFUNCTION]: 'Dysfonctionnement',
      [IssueType.OTHER]: 'Autre',
    };
    return labels[issueType] || issueType;
  }

  getResolutionLabel(resolution?: ResolutionType): string {
    if (!resolution) return '';
    const labels: Record<string, string> = {
      [ResolutionType.REPAIR]: 'Réparation',
      [ResolutionType.REPLACE]: 'Remplacement',
    };
    return labels[resolution] || resolution;
  }

  formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }
}
