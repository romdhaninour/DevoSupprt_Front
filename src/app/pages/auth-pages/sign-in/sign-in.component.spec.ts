/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SignInComponent } from './sign-in.component';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { SigninFormComponent } from '../../../shared/components/auth/signin-form/signin-form.component';
import { of } from 'rxjs';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let activatedRoute: ActivatedRoute;

  beforeEach(async () => {
    const mockActivatedRoute = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [SignInComponent, AuthPageLayoutComponent, SigninFormComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with message hidden', () => {
    expect(component.showMessage).toBe(false);
    expect(component.message).toBe('');
  });

  it('should show account_inactive message from query params', (done) => {
    TestBed.resetTestingModule();
    
    const mockActivatedRoute = {
      queryParams: of({ message: 'account_inactive' })
    };

    TestBed.configureTestingModule({
      imports: [SignInComponent, AuthPageLayoutComponent, SigninFormComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });

    const newFixture = TestBed.createComponent(SignInComponent);
    const newComponent = newFixture.componentInstance;

    newFixture.detectChanges();
    
    // Wait for async operations
    setTimeout(() => {
      newFixture.detectChanges();
      expect(newComponent.showMessage).toBe(true);
      expect(newComponent.message).toContain('Votre compte est inactif');
      done();
    }, 0);
  });

  it('should show account_not_registered message from query params', (done) => {
    TestBed.resetTestingModule();
    
    const mockActivatedRoute = {
      queryParams: of({ message: 'account_not_registered' })
    };

    TestBed.configureTestingModule({
      imports: [SignInComponent, AuthPageLayoutComponent, SigninFormComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });

    const newFixture = TestBed.createComponent(SignInComponent);
    const newComponent = newFixture.componentInstance;

    newFixture.detectChanges();
    
    setTimeout(() => {
      newFixture.detectChanges();
      expect(newComponent.showMessage).toBe(true);
      expect(newComponent.message).toContain('Ce compte Google n\'est pas enregistré');
      done();
    }, 0);
  });

  it('should not show message for unknown query params', (done) => {
    TestBed.resetTestingModule();
    
    const mockActivatedRoute = {
      queryParams: of({ message: 'unknown_message' })
    };

    TestBed.configureTestingModule({
      imports: [SignInComponent, AuthPageLayoutComponent, SigninFormComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });

    const newFixture = TestBed.createComponent(SignInComponent);
    const newComponent = newFixture.componentInstance;

    newFixture.detectChanges();
    
    setTimeout(() => {
      newFixture.detectChanges();
      expect(newComponent.showMessage).toBe(false);
      done();
    }, 0);
  });
});
