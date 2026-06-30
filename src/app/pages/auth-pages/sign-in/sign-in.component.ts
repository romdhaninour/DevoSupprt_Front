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
      if (params['message'] === 'account_inactive') {
        this.message = 'Your account is inactive. Please wait for the admin to activate your account.';
        this.showMessage = true;
      }
    });
  }
}
