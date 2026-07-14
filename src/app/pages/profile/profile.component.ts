
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ApiService } from '../../services/api.service';
import { ImageCompressionUtil } from '../../utils/image-compression.util';

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
  isEditModalOpen = false;
  editForm = {
    prenom: '',
    nom: '',
    profilePicture: ''
  };
  saving = false;
  imageError = false;
  uploadingProfilePicture = false;
  selectedProfilePicture: File | null = null;

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
      },
      error: (err) => {
        console.error('Failed to load current user data:', err);
        this.loadFromLocalStorage();
      }
    });
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
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedProfilePicture = null;
  }

  onProfilePictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (ImageCompressionUtil.isImage(file)) {
        this.selectedProfilePicture = file;
        this.imageError = false;
      } else {
        this.imageError = true;
        this.selectedProfilePicture = null;
      }
    }
  }

  async uploadProfilePicture() {
    if (!this.selectedProfilePicture) return;

    this.uploadingProfilePicture = true;

    try {
      // Compress image before upload
      const compressedFile = await ImageCompressionUtil.compressImage(this.selectedProfilePicture, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        outputFormat: 'image/jpeg',
      });

      console.log(`Profile picture compressed: ${ImageCompressionUtil.formatFileSize(this.selectedProfilePicture.size)} -> ${ImageCompressionUtil.formatFileSize(compressedFile.size)}`);

      // Convert to base64 for storage (since we're using URL field)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.editForm.profilePicture = base64;
        this.uploadingProfilePicture = false;
        this.selectedProfilePicture = null;
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Profile picture compression failed:', error);
      this.uploadingProfilePicture = false;
      alert('Failed to process image. Please try again.');
    }
  }

  formatFileSize(bytes: number): string {
    return ImageCompressionUtil.formatFileSize(bytes);
  }

  saveProfile() {
    this.saving = true;
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    console.log('saveProfile - userId from localStorage:', userId);
    console.log('saveProfile - editForm:', this.editForm);
    
    if (userId) {
      console.log('Calling API to update user:', userId);
      // Update via API
      this.apiService.updateUser(userId, {
        nom: this.editForm.nom,
        prenom: this.editForm.prenom,
        profilePicture: this.editForm.profilePicture
      }).subscribe({
        next: (updatedUser) => {
          console.log('Profile updated successfully:', updatedUser);
          // Update localStorage with new values
          localStorage.setItem('user_prenom', this.editForm.prenom);
          localStorage.setItem('user_nom', this.editForm.nom);
          localStorage.setItem('user_profile_picture', this.editForm.profilePicture);
          
          // Update user object
          this.user.prenom = this.editForm.prenom;
          this.user.nom = this.editForm.nom;
          this.user.profilePicture = this.editForm.profilePicture;
          
          this.saving = false;
          this.closeEditModal();
        },
        error: (err) => {
          console.error('Failed to update profile:', err);
          this.saving = false;
          alert('Failed to update profile. Please try again.');
        }
      });
    } else {
      console.log('No userId found, falling back to localStorage only');
      // Fallback to localStorage only if no user ID
      localStorage.setItem('user_prenom', this.editForm.prenom);
      localStorage.setItem('user_nom', this.editForm.nom);
      localStorage.setItem('user_profile_picture', this.editForm.profilePicture);
      
      this.user.prenom = this.editForm.prenom;
      this.user.nom = this.editForm.nom;
      this.user.profilePicture = this.editForm.profilePicture;
      
      this.saving = false;
      this.closeEditModal();
    }
  }
}
