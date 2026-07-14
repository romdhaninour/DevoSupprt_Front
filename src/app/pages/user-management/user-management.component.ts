import { Component, OnInit, signal, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
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
  importingUsers = signal(false);
  importFeedback = signal<string | null>(null);
  importFeedbackType = signal<'success' | 'error' | null>(null);
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  
  get totalPages(): number {
    return Math.ceil(this.filteredUsers().length / this.itemsPerPage);
  }

  getPaginatedRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredUsers().length);
    return `${start} à ${end} sur ${this.filteredUsers().length}`;
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

  isAdmin(): boolean {
    return localStorage.getItem('user_role') === 'ADMIN';
  }

  getRoleBadgeColors(role: string) {
    const normalizedRole = (role || '').toUpperCase();
    switch (normalizedRole) {
      case 'ADMIN':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800',
          ring: 'ring-red-500'
        };
      case 'IT':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          text: 'text-blue-700 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800',
          ring: 'ring-blue-500'
        };
      case 'CONSULTANT':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/30',
          text: 'text-purple-700 dark:text-purple-400',
          border: 'border-purple-200 dark:border-purple-800',
          ring: 'ring-purple-500'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700',
          ring: 'ring-gray-500'
        };
    }
  }

  getStatusBadgeColors(status: string) {
    const normalizedStatus = (status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'active':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800'
        };
      case 'inactive':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800'
        };
      case 'archived':
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700'
        };
    }
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
  addUserModalOpen = signal(false);
  selectedUser = signal<User | null>(null);
  selectedRole = signal<string>('');
  openActionMenuId = signal<string | null>(null);
  actionMenuPosition = signal<{ top: number; left: number } | null>(null);
  newUserNom = '';
  newUserPrenom = '';
  newUserEmail = '';
  newUserRole: 'ADMIN' | 'IT' | 'CONSULTANT' = 'IT';
  newUserError = signal<string | null>(null);

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
    this.archiveModalOpen.set(true);
  }

  resetNewUserForm() {
    this.newUserNom = '';
    this.newUserPrenom = '';
    this.newUserEmail = '';
    this.newUserRole = 'IT';
    this.newUserError.set(null);
  }

  openAddUserModal() {
    this.resetNewUserForm();
    this.addUserModalOpen.set(true);
    this.openActionMenuId.set(null);
  }

  confirmAddUser() {
    const email = this.newUserEmail.trim();
    if (!this.newUserNom.trim() || !this.newUserPrenom.trim() || !email) {
      this.newUserError.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.newUserError.set('Veuillez saisir une adresse email valide.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.newUserError.set('Vous devez être connecté pour ajouter un utilisateur.');
      return;
    }

    this.apiService.createUser({
      nom: this.newUserNom.trim(),
      prenom: this.newUserPrenom.trim(),
      email,
      role: this.newUserRole,
    }).subscribe({
      next: () => {
        this.loadUsers();
        this.addUserModalOpen.set(false);
        this.resetNewUserForm();
      },
      error: (err: any) => {
        if (err?.status === 401) {
          this.newUserError.set('Session expirée ou non autorisée. Veuillez vous reconnecter.');
        } else if (err?.status === 403) {
          this.newUserError.set('Vous devez être administrateur pour ajouter un utilisateur.');
        } else {
          this.newUserError.set(err?.error?.message || 'Impossible d\'ajouter l\'utilisateur.');
        }
      }
    });
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
    this.addUserModalOpen.set(false);
    this.archiveModalOpen.set(false);
    this.deleteModalOpen.set(false);
    this.activationModalOpen.set(false);
    this.deactivationModalOpen.set(false);
    this.editModalOpen.set(false);
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

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
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

  getProfilePictureUrl(user: User): string {
    if (user.profilePicture && user.profilePicture !== '') {
      const proxyUrl = `http://localhost:3000/users/${user._id}/profile-picture`;
      console.log('UserManagementComponent.getProfilePictureUrl - using backend proxy:', proxyUrl);
      return proxyUrl;
    }
    return '';
  }

  async handleExcelImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.importingUsers.set(true);
    this.importFeedback.set(null);
    this.importFeedbackType.set(null);

    try {
      const result = await firstValueFrom(this.apiService.importUsers(file));
      this.loadUsers();
      this.importFeedback.set(`Import terminé : ${result.success} utilisateur(s) ajouté(s), ${result.failed} échec(s).`);
      this.importFeedbackType.set('success');
      if (result.errors.length > 0) {
        this.importFeedback.set(this.importFeedback() + '\nErreurs: ' + result.errors.join('\n'));
      }
    } catch (err: any) {
      this.importFeedback.set(err?.message || 'Impossible d\'importer les utilisateurs depuis le fichier.');
      this.importFeedbackType.set('error');
    } finally {
      this.importingUsers.set(false);
      input.value = '';
    }
  }

  exportUsers() {
    this.apiService.exportUsers(this.searchTerm()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'utilisateurs.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.error.set('Impossible d\'exporter la liste des utilisateurs.');
      },
    });
  }
}
