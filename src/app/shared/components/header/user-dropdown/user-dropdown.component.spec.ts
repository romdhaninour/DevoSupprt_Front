import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { UserDropdownComponent } from './user-dropdown.component';
import { ApiService } from '../../../../services/api.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('UserDropdownComponent', () => {
  let component: UserDropdownComponent;
  let fixture: ComponentFixture<UserDropdownComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: of({}) });
    const apiSpy = jasmine.createSpyObj('ApiService', ['getCurrentUser']);
    apiSpy.getCurrentUser.and.returnValue(of({
      _id: 'u1', nom: 'Doe', prenom: 'John', email: 'john@test.com', profilePicture: 'pic.jpg'
    } as any));

    await TestBed.configureTestingModule({
      imports: [UserDropdownComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDropdownComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load user data on init', () => {
      component.ngOnInit();
      expect(apiServiceSpy.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('loadUserData', () => {
    it('should load user from localStorage and API', () => {
      localStorage.setItem('user_nom', 'LocalDoe');
      localStorage.setItem('user_prenom', 'LocalJohn');
      localStorage.setItem('user_email', 'local@test.com');
      localStorage.setItem('user_profile_picture', 'local-pic.jpg');

      component.loadUserData();

      expect(component.user.prenom).toBe('John');
      expect(component.user.nom).toBe('Doe');
      expect(component.user.email).toBe('john@test.com');
    });

    it('should fallback to localStorage on API error', () => {
      apiServiceSpy.getCurrentUser.and.returnValue(throwError(() => new Error('fail')));
      localStorage.setItem('user_nom', 'LocalDoe');
      localStorage.setItem('user_prenom', 'LocalJohn');
      localStorage.setItem('user_email', 'local@test.com');
      localStorage.setItem('user_profile_picture', 'local-pic.jpg');

      component.loadUserData();

      expect(component.user.nom).toBe('LocalDoe');
      expect(component.user.prenom).toBe('LocalJohn');
    });

    it('should use stored profilePicture when API user has none', () => {
      apiServiceSpy.getCurrentUser.and.returnValue(of({
        _id: 'u1', nom: 'Doe', prenom: 'John', profilePicture: ''
      } as any));
      localStorage.setItem('user_profile_picture', 'stored-pic.jpg');

      component.loadUserData();
      expect(component.user.profilePicture).toBe('stored-pic.jpg');
    });
  });

  describe('displayName', () => {
    it('should return full name', () => {
      component.user = { prenom: 'John', nom: 'Doe' };
      expect(component.displayName).toBe('John Doe');
    });

    it('should return "User" when no names', () => {
      component.user = {};
      expect(component.displayName).toBe('User');
    });
  });

  describe('initials', () => {
    it('should return uppercase initials', () => {
      component.user = { prenom: 'John', nom: 'Doe' };
      expect(component.initials).toBe('JD');
    });

    it('should return empty string when no names', () => {
      component.user = {};
      expect(component.initials).toBe('');
    });
  });

  describe('avatar', () => {
    it('should return empty string when no userId', () => {
      component.user = {};
      expect(component.avatar).toBe('');
    });

    it('should return proxy URL when userId and profilePicture exist', () => {
      localStorage.setItem('user_id', 'u123');
      component.user = { profilePicture: 'pic.jpg' };
      expect(component.avatar).toContain('/users/u123/profile-picture');
    });

    it('should use stored profile picture when user has no profilePicture', () => {
      localStorage.setItem('user_id', 'u123');
      localStorage.setItem('user_profile_picture', 'stored-pic.jpg');
      component.user = {};
      expect(component.avatar).toContain('/users/u123/profile-picture');
    });
  });

  describe('toggleDropdown', () => {
    it('should toggle dropdown open', () => {
      component.isOpen = false;
      component.toggleDropdown();
      expect(component.isOpen).toBe(true);
    });

    it('should toggle dropdown closed', () => {
      component.isOpen = true;
      component.toggleDropdown();
      expect(component.isOpen).toBe(false);
    });
  });

  describe('closeDropdown', () => {
    it('should close dropdown', () => {
      component.isOpen = true;
      component.closeDropdown();
      expect(component.isOpen).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should clear localStorage and navigate to /signin', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('user_role', 'ADMIN');
      localStorage.setItem('user_nom', 'Doe');
      localStorage.setItem('user_prenom', 'John');
      localStorage.setItem('user_email', 'john@test.com');
      localStorage.setItem('user_profile_picture', 'pic.jpg');
      localStorage.setItem('user_status', 'active');

      component.signOut();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_role')).toBeNull();
      expect(localStorage.getItem('user_nom')).toBeNull();
      expect(localStorage.getItem('user_prenom')).toBeNull();
      expect(localStorage.getItem('user_email')).toBeNull();
      expect(localStorage.getItem('user_profile_picture')).toBeNull();
      expect(localStorage.getItem('user_status')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/signin']);
    });
  });
});
