import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-archived-users',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './archived-users.component.html',
  styleUrl: './archived-users.component.css'
})
export class ArchivedUsersComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  deleteModalOpen = signal(false);
  selectedUser = signal<User | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadArchivedUsers();
  }

  loadArchivedUsers() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getArchivedUsers().subscribe({
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
    this.apiService.restoreUser(id).subscribe({
      next: () => this.loadArchivedUsers(),
      error: (err) => this.error.set('Failed to restore user')
    });
  }

  openDeleteModal(user: User) {
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
    this.selectedUser.set(null);
  }
}
