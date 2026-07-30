import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationDropdownComponent } from './notification-dropdown.component';
import { NotificationService } from '../../../../services/notification.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('NotificationDropdownComponent', () => {
  let component: NotificationDropdownComponent;
  let fixture: ComponentFixture<NotificationDropdownComponent>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('NotificationService', ['markAllAsRead'], {
      hasUnread: of(false),
      unreadCount: of(0),
      notifications: of([]),
    });

    await TestBed.configureTestingModule({
      imports: [NotificationDropdownComponent],
      providers: [{ provide: NotificationService, useValue: spy }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationDropdownComponent);
    component = fixture.componentInstance;
    notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleDropdown', () => {
    it('should open dropdown and mark all as read', () => {
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);
      expect(notificationServiceSpy.markAllAsRead).toHaveBeenCalled();
    });

    it('should close dropdown on second toggle', () => {
      component.toggleDropdown();
      component.toggleDropdown();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('closeDropdown', () => {
    it('should close the dropdown', () => {
      component.toggleDropdown();
      component.closeDropdown();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('canViewNotifications', () => {
    it('should return true for ADMIN', () => {
      localStorage.setItem('user_role', 'ADMIN');
      expect(component.canViewNotifications).toBe(true);
    });

    it('should return true for IT', () => {
      localStorage.setItem('user_role', 'IT');
      expect(component.canViewNotifications).toBe(true);
    });

    it('should return false for CONSULTANT', () => {
      localStorage.setItem('user_role', 'CONSULTANT');
      expect(component.canViewNotifications).toBe(false);
    });

    it('should return false when no role', () => {
      localStorage.removeItem('user_role');
      expect(component.canViewNotifications).toBe(false);
    });
  });
});
