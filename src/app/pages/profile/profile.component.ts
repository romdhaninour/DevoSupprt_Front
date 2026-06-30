
import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';

@Component({
  selector: 'app-profile',
  imports: [
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    UserInfoCardComponent
],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  user: any = {};

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.user = {
      nom: localStorage.getItem('user_nom') || '',
      prenom: localStorage.getItem('user_prenom') || '',
      email: localStorage.getItem('user_email') || '',
      role: localStorage.getItem('user_role') || '',
      profilePicture: localStorage.getItem('user_profile_picture') || ''
    };
  }
}
