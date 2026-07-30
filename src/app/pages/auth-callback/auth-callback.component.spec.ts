import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthCallbackComponent } from './auth-callback.component';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /signin when no token provided', () => {
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('should navigate to /signin when inactive and not ADMIN', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({ token: 'abc', status: 'inactive', role: 'CONSULTANT' }) } },
      ]
    });
    const newFixture = TestBed.createComponent(AuthCallbackComponent);
    newFixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/signin'], {
      queryParams: { message: 'account_inactive' }
    });
  });

  it('should store token and navigate to / for ADMIN with active status', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({ token: 'mytoken', status: 'active', role: 'ADMIN', nom: 'Doe', prenom: 'John', email: 'john@test.com', userId: 'u1' }) } },
      ]
    });
    const newFixture = TestBed.createComponent(AuthCallbackComponent);
    newFixture.detectChanges();

    expect(localStorage.getItem('auth_token')).toBe('mytoken');
    expect(localStorage.getItem('user_role')).toBe('ADMIN');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should store token and navigate to /consultant-devices for CONSULTANT', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({ token: 'tok', status: 'active', role: 'CONSULTANT', profilePicture: 'pic.jpg' }) } },
      ]
    });
    const newFixture = TestBed.createComponent(AuthCallbackComponent);
    newFixture.detectChanges();

    expect(localStorage.getItem('auth_token')).toBe('tok');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/consultant-devices']);
  });

  it('should store token and navigate to / for IT role', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({ token: 'tok', status: 'active', role: 'IT' }) } },
      ]
    });
    const newFixture = TestBed.createComponent(AuthCallbackComponent);
    newFixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle inactive ADMIN by navigating to / (admin can be inactive but still ADMIN)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({ token: 'tok', status: 'inactive', role: 'ADMIN' }) } },
      ]
    });
    const newFixture = TestBed.createComponent(AuthCallbackComponent);
    newFixture.detectChanges();

    expect(localStorage.getItem('auth_token')).toBe('tok');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should store all user params in localStorage', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({
          token: 'tok123', status: 'active', role: 'IT',
          profilePicture: 'pic.png', nom: 'Smith', prenom: 'Jane',
          email: 'jane@test.com', userId: 'uid123'
        }) } },
      ]
    });
    const newFixture = TestBed.createComponent(AuthCallbackComponent);
    newFixture.detectChanges();

    expect(localStorage.getItem('auth_token')).toBe('tok123');
    expect(localStorage.getItem('user_role')).toBe('IT');
    expect(localStorage.getItem('user_status')).toBe('active');
    expect(localStorage.getItem('user_profile_picture')).toBe('pic.png');
    expect(localStorage.getItem('user_nom')).toBe('Smith');
    expect(localStorage.getItem('user_prenom')).toBe('Jane');
    expect(localStorage.getItem('user_email')).toBe('jane@test.com');
    expect(localStorage.getItem('user_id')).toBe('uid123');
  });

  it('should default profilePicture to empty string when not provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({ token: 'tok', status: 'active', role: 'IT' }) } },
      ]
    });
    const newFixture = TestBed.createComponent(AuthCallbackComponent);
    newFixture.detectChanges();

    expect(localStorage.getItem('user_profile_picture')).toBe('');
  });
});
