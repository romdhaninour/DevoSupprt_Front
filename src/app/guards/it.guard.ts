import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ITGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const userRole = localStorage.getItem('user_role');
    const isIT = userRole === 'IT' || userRole === 'ADMIN';

    if (isIT) {
      return true;
    } else {
      // Redirect to dashboard if not IT or admin
      this.router.navigate(['/']);
      return false;
    }
  }
}
