import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

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
    private notificationService: NotificationService
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
      
      console.log('Auth callback params:', { token, status, role, profilePicture, nom, prenom, email });

      if (token) {
        // Check user status and role
        if (status === 'inactive' && role !== 'ADMIN') {
          console.log('Redirecting to sign-in: inactive non-admin user');
          // Add notification for admin about new user signup
          this.notificationService.addNotification(
            `New user ${prenom} ${nom} (${email}) signed up and needs activation`,
            'user_signup'
          );
          // Inactive non-admin users: redirect to sign-in with message
          this.router.navigate(['/signin'], {
            queryParams: { message: 'account_inactive' }
          });
        } else {
          console.log('Redirecting to dashboard: active user or admin');
          // Active users or admins: store token and redirect to dashboard
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_role', role);
          localStorage.setItem('user_status', status);
          localStorage.setItem('user_profile_picture', profilePicture || '');
          localStorage.setItem('user_nom', nom || '');
          localStorage.setItem('user_prenom', prenom || '');
          localStorage.setItem('user_email', email || '');
          this.router.navigate(['/']);
        }
      } else {
        // Handle error - no token received
        console.error('No token received from OAuth callback');
        this.router.navigate(['/signin']);
      }
    });
  }
}
