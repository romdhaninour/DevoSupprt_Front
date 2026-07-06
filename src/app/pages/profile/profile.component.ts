
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ApiService } from '../../services/api.service';

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

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const localProfilePicture = localStorage.getItem('user_profile_picture') || '';
    console.log('loadUserData - current user fetch');

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
        console.log('Loaded current user data from API:', currentUser);
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
