import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const userRole = localStorage.getItem('user_role');
    const isAdmin = userRole === 'ADMIN';

    if (isAdmin) {
      return true;
    } else {
      // Redirect to dashboard if not admin
      this.router.navigate(['/']);
      return false;
    }
  }
}
