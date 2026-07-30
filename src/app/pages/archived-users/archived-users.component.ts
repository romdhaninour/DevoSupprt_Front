import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-archived-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent],
  templateUrl: './archived-users.component.html',
  styleUrl: './archived-users.component.css'
})
export class ArchivedUsersComponent implements OnInit {
  users = signal<User[]>([]);
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const role = this.roleFilter();

    let filtered = this.users();
    if (term) {
      filtered = filtered.filter(user =>
        user.prenom.toLowerCase().includes(term) ||
        user.nom.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    if (role !== 'all') {
      filtered = filtered.filter(user => user.role === role);
    }

    return filtered;
  });
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  roleFilter = signal<string>('all');
  sortOrder = signal<'desc' | 'asc'>('desc');
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  
  get totalPages(): number {
    return Math.ceil(this.filteredUsers().length / this.itemsPerPage);
  }
  
  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers().slice(start, start + this.itemsPerPage);
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // Reset pagination when search term changes
  updateSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.currentPage = 1;
  }

  // Reset pagination when role filter changes
  updateRoleFilter(role: string) {
    this.roleFilter.set(role);
    this.currentPage = 1;
  }

  toggleSortOrder() {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    this.loadArchivedUsers();
  }
  
  deleteModalOpen = signal(false);
  restoreModalOpen = signal(false);
  selectedUser = signal<User | null>(null);
  openActionMenuId = signal<string | null>(null);
  actionMenuPosition = signal<{ top: number; left: number } | null>(null);

  constructor(private apiService: ApiService, private router: Router) {}

  getRoleBadgeColor(role: string): string {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'CONSULTANT':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
      case 'IT':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  }

  ngOnInit() {
    this.loadArchivedUsers();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.openActionMenuId()) {
      if (!target.closest('.action-menu-container')) {
        this.openActionMenuId.set(null);
      }
    }
  }

  toggleActionMenu(userId: string, event: MouseEvent) {
    const current = this.openActionMenuId();
    if (current === userId) {
      this.openActionMenuId.set(null);
      this.actionMenuPosition.set(null);
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 140;
    const padding = 12;
    const left = Math.min(Math.max(rect.right - menuWidth, padding), window.innerWidth - menuWidth - padding);
    const hasSpaceBelow = window.innerHeight - rect.bottom > menuHeight + padding;
    const desiredTop = hasSpaceBelow ? rect.bottom : rect.top - menuHeight;
    const minTop = padding;
    const maxTop = window.innerHeight - menuHeight - padding;
    const top = Math.min(Math.max(desiredTop, minTop), maxTop);

    this.actionMenuPosition.set({ top, left });
    this.openActionMenuId.set(userId);
  }

  loadArchivedUsers() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getArchivedUsers(this.sortOrder()).subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load archived users');
        this.loading.set(false);
      }
    });
  }

  restoreUser(id: string) {
    this.openActionMenuId.set(null);
    this.apiService.restoreUser(id).subscribe({
      next: () => this.loadArchivedUsers(),
      error: (err) => this.error.set('Failed to restore user')
    });
  }

  openRestoreModal(user: User) {
    this.openActionMenuId.set(null);
    this.selectedUser.set(user);
    this.restoreModalOpen.set(true);
  }

  confirmRestore() {
    if (this.selectedUser()) {
      this.restoreUser(this.selectedUser()!._id);
      this.restoreModalOpen.set(false);
      this.selectedUser.set(null);
    }
  }

  openDeleteModal(user: User) {
    this.openActionMenuId.set(null);
    this.selectedUser.set(user);
    this.deleteModalOpen.set(true);
  }

  confirmDelete() {
    if (this.selectedUser()) {
      this.apiService.deleteUser(this.selectedUser()!._id).subscribe({
        next: () => {
          this.loadArchivedUsers();
          this.deleteModalOpen.set(false);
          this.selectedUser.set(null);
        },
        error: (err) => this.error.set('Failed to delete user')
      });
    }
  }

  closeModals() {
    this.deleteModalOpen.set(false);
    this.restoreModalOpen.set(false);
    this.selectedUser.set(null);
    this.openActionMenuId.set(null);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const fallback = parent.querySelector('div') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    const parent = img.parentElement;
    if (parent) {
      const fallback = parent.querySelector('div') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'none';
      }
    }
  }

  navigateToUser(userId: string) {
    this.router.navigate(['/archived-users', userId]);
  }
}
