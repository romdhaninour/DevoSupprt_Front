
import { Component, Input } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-signin-form',
  imports: [
    RouterModule,
    FormsModule,
    CommonModule,
],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {
  @Input() message: string = '';

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';

  constructor(private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    console.log('Email:', this.email);
    console.log('Password:', this.password);
    console.log('Remember Me:', this.isChecked);
  }

  signInWithGoogle() {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}