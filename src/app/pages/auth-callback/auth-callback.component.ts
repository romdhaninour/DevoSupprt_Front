import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const status = params['status'];
      const role = params['role'];
      const profilePicture = params['profilePicture'];
      const nom = params['nom'];
      const prenom = params['prenom'];
      const email = params['email'];
      const userId = params['userId'];

      if (token) {
        if (status === 'inactive' && role !== 'ADMIN') {
          this.router.navigate(['/signin'], {
            queryParams: { message: 'account_inactive' }
          });
        } else {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_role', role);
          localStorage.setItem('user_status', status);
          localStorage.setItem('user_profile_picture', profilePicture || '');
          localStorage.setItem('user_nom', nom || '');
          localStorage.setItem('user_prenom', prenom || '');
          localStorage.setItem('user_email', email || '');
          localStorage.setItem('user_id', userId || '');
          this.router.navigate(['/']);
        }
      } else {
        this.router.navigate(['/signin']);
      }
    });
  }
}
