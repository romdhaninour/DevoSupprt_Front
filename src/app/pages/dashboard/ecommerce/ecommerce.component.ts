import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  userRole = signal(localStorage.getItem('user_role') || '');
  userName = signal(localStorage.getItem('user_prenom') || '');
  loading = signal(true);
  stats = signal<any>(null);

  isAdmin = computed(() => this.userRole() === 'ADMIN');
  isIT = computed(() => this.userRole() === 'IT');
  isConsultant = computed(() => this.userRole() === 'CONSULTANT');

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  barWidth(count: number, map: Record<string, number>): number {
    const max = Math.max(...Object.values(map || {}), 1);
    return Math.round((count / max) * 100);
  }

  priorityLabel(key: string): string {
    const labels: Record<string, string> = {
      low: 'Faible',
      medium: 'Moyen',
      high: 'Eleve',
      urgent: 'Urgent',
    };
    return labels[key] || key;
  }

  priorityColor(key: string): string {
    const colors: Record<string, string> = {
      low: 'bg-emerald-500 dark:bg-emerald-400',
      medium: 'bg-sky-500 dark:bg-sky-400',
      high: 'bg-amber-500 dark:bg-amber-400',
      urgent: 'bg-rose-500 dark:bg-rose-400',
    };
    return colors[key] || 'bg-gray-400';
  }

  issueTypeLabel(key: string): string {
    const labels: Record<string, string> = {
      damaged: 'Endommage',
      destroyed: 'Detruit',
      malfunction: 'Dysfonctionnement',
      other: 'Autre',
    };
    return labels[key] || key;
  }

  issueTypeColor(key: string): string {
    const colors: Record<string, string> = {
      damaged: 'bg-amber-500 dark:bg-amber-400',
      destroyed: 'bg-rose-500 dark:bg-rose-400',
      malfunction: 'bg-violet-500 dark:bg-violet-400',
      other: 'bg-gray-400 dark:bg-gray-500',
    };
    return colors[key] || 'bg-gray-400';
  }

  deviceTypeLabel(key: string): string {
    const labels: Record<string, string> = {
      Laptop: 'Laptop',
      Desktop: 'Desktop',
      Mobile: 'Mobile',
      Tablet: 'Tablette',
      Printer: 'Imprimante',
      Scanner: 'Scanner',
      Monitor: 'Moniteur',
      Router: 'Routeur',
      Switch: 'Switch',
      'Access Point': 'Point d\'acces',
      Camera: 'Camera',
      Projecteur: 'Projecteur',
    };
    return labels[key] || key;
  }

  deviceTypeColor(key: string): string {
    const colors: Record<string, string> = {
      Laptop: 'bg-blue-500 dark:bg-blue-400',
      Desktop: 'bg-violet-500 dark:bg-violet-400',
      Mobile: 'bg-emerald-500 dark:bg-emerald-400',
      Tablet: 'bg-sky-500 dark:bg-sky-400',
      Printer: 'bg-amber-500 dark:bg-amber-400',
      Scanner: 'bg-orange-500 dark:bg-orange-400',
      Monitor: 'bg-indigo-500 dark:bg-indigo-400',
      Router: 'bg-teal-500 dark:bg-teal-400',
      Switch: 'bg-cyan-500 dark:bg-cyan-400',
      'Access Point': 'bg-pink-500 dark:bg-pink-400',
      Camera: 'bg-rose-500 dark:bg-rose-400',
      Projecteur: 'bg-purple-500 dark:bg-purple-400',
    };
    return colors[key] || 'bg-gray-400';
  }

  statusBadge(status: string): string {
    const badges: Record<string, string> = {
      open: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      in_progress: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
      resolved: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
      closed: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-600';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Resolu',
      closed: 'Ferme',
    };
    return labels[status] || status;
  }

  priorityBadge(priority: string): string {
    const badges: Record<string, string> = {
      low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      medium: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
      high: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
      urgent: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    };
    return badges[priority] || 'bg-gray-100 text-gray-600';
  }

  timeAgo(date: string): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "a l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `il y a ${diffD}j`;
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
