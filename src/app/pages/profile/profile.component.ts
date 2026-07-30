
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ApiService } from '../../services/api.service';
import { ImageCompressionUtil } from '../../utils/image-compression.util';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    FormsModule,
    UserMetaCardComponent,
    UserInfoCardComponent,
    ModalComponent
],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  user: any = {};
  tickets = signal<Ticket[]>([]);
  devices = signal<any[]>([]);
  isEditModalOpen = signal(false);
  editForm = {
    prenom: '',
    nom: '',
    profilePicture: ''
  };
  saving = signal(false);
  imageError = signal(false);
  uploadingProfilePicture = signal(false);
  selectedProfilePicture = signal<File | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const localProfilePicture = localStorage.getItem('user_profile_picture') || '';

    this.apiService.getCurrentUser().subscribe({
      next: (currentUser) => {
        this.user = {
          ...currentUser,
          profilePicture: currentUser.profilePicture || localProfilePicture,
        };
        this.editForm = {
          prenom: currentUser.prenom || '',
          nom: currentUser.nom || '',
          profilePicture: currentUser.profilePicture || localProfilePicture || ''
        };
        this.loadTickets();
        this.loadDevices();
      },
      error: (err) => {
        console.error('Failed to load current user data:', err);
        this.loadFromLocalStorage();
      }
    });
  }

  loadTickets() {
    this.apiService.getTickets(this.user._id ? undefined : undefined, undefined, undefined, undefined, undefined, true).subscribe({
      next: (res) => {
        this.tickets.set(res.tickets || []);
      },
      error: (err) => {
        console.error('Failed to load tickets:', err);
      }
    });
  }

  loadDevices() {
    this.apiService.getAssignedDevices(1, 100).subscribe({
      next: (res) => {
        this.devices.set(res.devices || []);
      },
      error: (err) => {
        console.error('Failed to load devices:', err);
      }
    });
  }

  getTicketStatusColor(status: string): string {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getTicketPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getDeviceStatusColor(status: string): string {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'assigned': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'maintenance': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'retired': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getTicketStatusLabel(status: string): string {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Fermé';
      default: return status;
    }
  }

  getDeviceStatusLabel(status: string): string {
    switch (status) {
      case 'available': return 'Disponible';
      case 'assigned': return 'Assigné';
      case 'maintenance': return 'Maintenance';
      case 'retired': return 'Retiré';
      default: return status;
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  }

  loadFromLocalStorage() {
    this.user = {
      nom: localStorage.getItem('user_nom') || '',
      prenom: localStorage.getItem('user_prenom') || '',
      email: localStorage.getItem('user_email') || '',
      role: localStorage.getItem('user_role') || '',
      profilePicture: localStorage.getItem('user_profile_picture') || '',
      phone: localStorage.getItem('user_phone') || '',
      bio: localStorage.getItem('user_bio') || ''
    };
    
    // Initialize edit form with current user data
    this.editForm = {
      prenom: this.user.prenom || '',
      nom: this.user.nom || '',
      profilePicture: this.user.profilePicture || ''
    };
  }

  openEditModal() {
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.selectedProfilePicture.set(null);
  }

  onProfilePictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (ImageCompressionUtil.isImage(file)) {
        this.selectedProfilePicture.set(file);
        this.imageError.set(false);
      } else {
        this.imageError.set(true);
        this.selectedProfilePicture.set(null);
      }
    }
  }

  async uploadProfilePicture() {
    const file = this.selectedProfilePicture();
    if (!file) return;

    this.uploadingProfilePicture.set(true);

    try {
      const compressedFile = await ImageCompressionUtil.compressImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        outputFormat: 'image/jpeg',
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.editForm.profilePicture = base64;
        this.uploadingProfilePicture.set(false);
        this.selectedProfilePicture.set(null);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Profile picture compression failed:', error);
      this.uploadingProfilePicture.set(false);
      alert('Failed to process image. Please try again.');
    }
  }

  formatFileSize(bytes: number): string {
    return ImageCompressionUtil.formatFileSize(bytes);
  }

  saveProfile() {
    this.saving.set(true);

    const userId = localStorage.getItem('user_id');

    if (userId) {
      this.apiService.updateUser(userId, {
        nom: this.editForm.nom,
        prenom: this.editForm.prenom,
        profilePicture: this.editForm.profilePicture
      }).subscribe({
        next: () => {
          localStorage.setItem('user_prenom', this.editForm.prenom);
          localStorage.setItem('user_nom', this.editForm.nom);

          if (this.editForm.profilePicture) {
            try {
              localStorage.setItem('user_profile_picture', this.editForm.profilePicture);
            } catch {
              console.warn('Profile picture too large for localStorage, skipping');
            }
          }

          this.user.prenom = this.editForm.prenom;
          this.user.nom = this.editForm.nom;
          this.user.profilePicture = this.editForm.profilePicture;

          this.saving.set(false);
          this.closeEditModal();
        },
        error: (err) => {
          console.error('Failed to update profile:', err);
          this.saving.set(false);
          alert('Failed to update profile. Please try again.');
        }
      });
    } else {
      localStorage.setItem('user_prenom', this.editForm.prenom);
      localStorage.setItem('user_nom', this.editForm.nom);

      if (this.editForm.profilePicture) {
        try {
          localStorage.setItem('user_profile_picture', this.editForm.profilePicture);
        } catch {
          console.warn('Profile picture too large for localStorage, skipping');
        }
      }

      this.user.prenom = this.editForm.prenom;
      this.user.nom = this.editForm.nom;
      this.user.profilePicture = this.editForm.profilePicture;

      this.saving.set(false);
      this.closeEditModal();
    }
  }
}
