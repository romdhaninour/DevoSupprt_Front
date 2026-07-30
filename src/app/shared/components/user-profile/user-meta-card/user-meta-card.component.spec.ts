import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserMetaCardComponent } from './user-meta-card.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UserMetaCardComponent', () => {
  let component: UserMetaCardComponent;
  let fixture: ComponentFixture<UserMetaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMetaCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMetaCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('displayName', () => {
    it('should return full name from prenom and nom', () => {
      component.user = { prenom: 'John', nom: 'Doe' };
      expect(component.displayName).toBe('John Doe');
    });

    it('should return "User" when no names', () => {
      component.user = {};
      expect(component.displayName).toBe('User');
    });

    it('should trim whitespace', () => {
      component.user = { prenom: ' John ', nom: ' Doe ' };
      expect(component.displayName).toBe('John Doe');
    });

    it('should handle only prenom', () => {
      component.user = { prenom: 'John' };
      expect(component.displayName).toBe('John');
    });

    it('should handle only nom', () => {
      component.user = { nom: 'Doe' };
      expect(component.displayName).toBe('Doe');
    });
  });

  describe('initials', () => {
    it('should return uppercase initials', () => {
      component.user = { prenom: 'John', nom: 'Doe' };
      expect(component.initials).toBe('JD');
    });

    it('should handle empty names', () => {
      component.user = {};
      expect(component.initials).toBe('');
    });

    it('should handle single character names', () => {
      component.user = { prenom: 'J', nom: 'D' };
      expect(component.initials).toBe('JD');
    });

    it('should handle null names', () => {
      component.user = { prenom: null, nom: null };
      expect(component.initials).toBe('');
    });
  });

  describe('avatar', () => {
    it('should return empty string when no userId and no profile picture', () => {
      component.user = {};
      expect(component.avatar).toBe('');
    });

    it('should return proxy URL when userId and profilePicture exist', () => {
      localStorage.setItem('user_id', 'u123');
      component.user = { profilePicture: 'http://example.com/pic.jpg' };
      expect(component.avatar).toContain('/users/u123/profile-picture');
    });

    it('should use stored profile picture when user has no profilePicture', () => {
      localStorage.setItem('user_id', 'u123');
      localStorage.setItem('user_profile_picture', 'stored-pic.jpg');
      component.user = {};
      expect(component.avatar).toContain('/users/u123/profile-picture');
    });
  });

  describe('roleBadgeColors', () => {
    it('should return rose colors for ADMIN', () => {
      component.user = { role: 'ADMIN' };
      expect(component.roleBadgeColors.bg).toContain('rose');
    });

    it('should return amber colors for IT', () => {
      component.user = { role: 'IT' };
      expect(component.roleBadgeColors.bg).toContain('amber');
    });

    it('should return cyan colors for CONSULTANT', () => {
      component.user = { role: 'CONSULTANT' };
      expect(component.roleBadgeColors.bg).toContain('cyan');
    });

    it('should return gray colors for unknown role', () => {
      component.user = { role: 'UNKNOWN' };
      expect(component.roleBadgeColors.bg).toContain('gray');
    });

    it('should handle empty role', () => {
      component.user = {};
      expect(component.roleBadgeColors.bg).toContain('gray');
    });
  });

  describe('roleDisplayName', () => {
    it('should return "Admin" for ADMIN', () => {
      component.user = { role: 'ADMIN' };
      expect(component.roleDisplayName).toBe('Admin');
    });

    it('should return "IT" for IT', () => {
      component.user = { role: 'IT' };
      expect(component.roleDisplayName).toBe('IT');
    });

    it('should return "Consultant" for CONSULTANT', () => {
      component.user = { role: 'CONSULTANT' };
      expect(component.roleDisplayName).toBe('Consultant');
    });

    it('should return role for unknown role', () => {
      component.user = { role: 'UNKNOWN' };
      expect(component.roleDisplayName).toBe('UNKNOWN');
    });

    it('should return "User" for empty role', () => {
      component.user = {};
      expect(component.roleDisplayName).toBe('User');
    });
  });

  describe('handleImageError', () => {
    it('should set fallback image source', () => {
      const event = {
        target: { src: '' }
      } as any;
      component.handleImageError(event);
      expect(event.target.src).toBe('/images/user/owner.jpg');
    });
  });
});
