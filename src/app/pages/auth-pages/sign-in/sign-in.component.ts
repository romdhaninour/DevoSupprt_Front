import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { SigninFormComponent } from '../../../shared/components/auth/signin-form/signin-form.component';

@Component({
  selector: 'app-sign-in',
  imports: [
    AuthPageLayoutComponent,
    SigninFormComponent,
  ],
  templateUrl: './sign-in.component.html',
  styles: ``
})
export class SignInComponent implements OnInit {
  message: string = '';
  showMessage: boolean = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const message = params['message'];
      if (message === 'account_inactive') {
        this.message = 'Votre compte est inactif. Veuillez attendre que l\'administrateur l\'active.';
        this.showMessage = true;
      } else if (message === 'account_not_registered') {
        this.message = 'Ce compte Google n\'est pas enregistré. Veuillez contacter l\'administrateur.';
        this.showMessage = true;
      }
    });
  }
}
