import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  archiveModalOpen = signal(false);
  deleteModalOpen = signal(false);
  editModalOpen = signal(false);
  archiveWarningModalOpen = signal(false);
  selectedUser = signal<User | null>(null);
  selectedRole = signal<string>('');

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
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

  openArchiveModal(user: User) {
    this.selectedUser.set(user);
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
    this.editModalOpen.set(false);
    this.archiveWarningModalOpen.set(false);
    this.selectedUser.set(null);
    this.selectedRole.set('');
  }

  openEditModal(user: User) {
    this.selectedUser.set(user);
    this.selectedRole.set(user.role);
    this.editModalOpen.set(true);
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
}
