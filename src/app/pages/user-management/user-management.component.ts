import { Component, OnInit, signal, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, PageBreadcrumbComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users = signal<User[]>([]);
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();
    
    let filtered = this.users();
    
    // Filter by search term
    if (term) {
      filtered = filtered.filter(user =>
        user.prenom.toLowerCase().includes(term) ||
        user.nom.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
    
    // Filter by role
    if (role !== 'all') {
      filtered = filtered.filter(user => user.role === role);
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(user => user.status === status);
    }
    
    return filtered;
  });
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  roleFilter = signal<string>('all');
  statusFilter = signal<string>('all');
  
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

  // Reset pagination when status filter changes
  updateStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.currentPage = 1;
  }
  
  getRoleDisplayName(role: string): string {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Admin';
      case 'IT':
        return 'IT';
      case 'CONSULTANT':
        return 'Consultant';
      default:
        return role || 'Inconnu';
    }
  }

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
  
  archiveModalOpen = signal(false);
  deleteModalOpen = signal(false);
  activationModalOpen = signal(false);
  deactivationModalOpen = signal(false);
  editModalOpen = signal(false);
  archiveWarningModalOpen = signal(false);
  selectedUser = signal<User | null>(null);
  selectedRole = signal<string>('');
  openActionMenuId = signal<string | null>(null);
  actionMenuPosition = signal<{ top: number; left: number } | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
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

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load users');
        this.loading.set(false);
      }
    });
  }

  activateUser(id: string) {
    this.apiService.activateUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.error.set('Failed to activate user')
    });
  }

  deactivateUser(id: string) {
    this.apiService.deactivateUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.error.set('Failed to deactivate user')
    });
  }

  openActivateModal(user: User) {
    this.selectedUser.set(user);
    this.activationModalOpen.set(true);
    this.openActionMenuId.set(null);
  }

  openDeactivateModal(user: User) {
    this.selectedUser.set(user);
    this.deactivationModalOpen.set(true);
    this.openActionMenuId.set(null);
  }

  confirmActivate() {
    if (this.selectedUser()) {
      this.activateUser(this.selectedUser()!._id);
      this.activationModalOpen.set(false);
      this.selectedUser.set(null);
    }
  }

  confirmDeactivate() {
    if (this.selectedUser()) {
      this.deactivateUser(this.selectedUser()!._id);
      this.deactivationModalOpen.set(false);
      this.selectedUser.set(null);
    }
  }

  openArchiveModal(user: User) {
    this.selectedUser.set(user);
    this.openActionMenuId.set(null);
    // Check if user is active - if so, show warning modal
    if (user.status === 'active') {
      this.archiveWarningModalOpen.set(true);
    } else {
      // User is inactive, can proceed to archive
      this.archiveModalOpen.set(true);
    }
  }

  confirmArchive() {
    if (this.selectedUser()) {
      this.apiService.archiveUser(this.selectedUser()!._id).subscribe({
        next: () => {
          this.loadUsers();
          this.archiveModalOpen.set(false);
          this.selectedUser.set(null);
        },
        error: (err) => this.error.set('Failed to archive user')
      });
    }
  }

  openDeleteModal(user: User) {
    this.selectedUser.set(user);
    this.deleteModalOpen.set(true);
  }

  confirmDelete() {
    if (this.selectedUser()) {
      this.apiService.deleteUser(this.selectedUser()!._id).subscribe({
        next: () => {
          this.loadUsers();
          this.deleteModalOpen.set(false);
          this.selectedUser.set(null);
        },
        error: (err) => this.error.set('Failed to delete user')
      });
    }
  }

  closeModals() {
    this.archiveModalOpen.set(false);
    this.deleteModalOpen.set(false);
    this.activationModalOpen.set(false);
    this.deactivationModalOpen.set(false);
    this.editModalOpen.set(false);
    this.archiveWarningModalOpen.set(false);
    this.selectedUser.set(null);
    this.selectedRole.set('');
    this.openActionMenuId.set(null);
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
    const menuHeight = 180;
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

  openEditModal(user: User) {
    this.selectedUser.set(user);
    this.selectedRole.set(user.role);
    this.editModalOpen.set(true);
    this.openActionMenuId.set(null);
  }

  confirmEdit() {
    if (this.selectedUser() && this.selectedRole()) {
      this.apiService.updateUser(this.selectedUser()!._id, { role: this.selectedRole() as any }).subscribe({
        next: () => {
          this.loadUsers();
          this.editModalOpen.set(false);
          this.selectedUser.set(null);
          this.selectedRole.set('');
        },
        error: (err: any) => this.error.set('Failed to update user role')
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
}
