import { Component, OnInit } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  user: any = {};

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.loadUserData();
    // Reload user data when navigation occurs
    this.router.events.subscribe(() => {
      this.loadUserData();
    });
  }

  loadUserData() {
    const localProfilePicture = localStorage.getItem('user_profile_picture') || '';
    this.user = {
      nom: localStorage.getItem('user_nom') || '',
      prenom: localStorage.getItem('user_prenom') || '',
      email: localStorage.getItem('user_email') || '',
      profilePicture: localProfilePicture
    };

    this.apiService.getCurrentUser().subscribe({
      next: (currentUser) => {
        this.user = {
          ...this.user,
          ...currentUser,
          profilePicture: currentUser.profilePicture || localProfilePicture
        };
      },
      error: () => {
        // keep stored fallback values if current user cannot be fetched
      }
    });
  }

  get displayName() {
    return `${this.user.prenom || ''} ${this.user.nom || ''}`.trim() || 'User';
  }

  get avatar() {
    const storedProfilePicture = localStorage.getItem('user_profile_picture');
    return this.user.profilePicture || storedProfilePicture || '/images/user/owner.png';
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  signOut() {
    // Clear all auth data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_nom');
    localStorage.removeItem('user_prenom');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_profile_picture');
    localStorage.removeItem('user_status');
    
    // Navigate to sign-in page
    this.router.navigate(['/signin']);
  }
}