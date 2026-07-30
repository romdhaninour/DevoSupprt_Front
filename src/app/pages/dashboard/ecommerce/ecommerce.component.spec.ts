/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EcommerceComponent } from './ecommerce.component';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('EcommerceComponent', () => {
  let component: EcommerceComponent;
  let fixture: ComponentFixture<EcommerceComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getDashboardStats']);

    await TestBed.configureTestingModule({
      imports: [EcommerceComponent, CommonModule],
      providers: [{ provide: ApiService, useValue: spy }, { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EcommerceComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component template', () => {
    apiServiceSpy.getDashboardStats.and.returnValue(of({}));
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadStats on init', () => {
      apiServiceSpy.getDashboardStats.and.returnValue(of({}));
      component.ngOnInit();
      expect(apiServiceSpy.getDashboardStats).toHaveBeenCalled();
    });
  });

  describe('loadStats', () => {
    it('should load stats successfully', () => {
      const mockStats = { totalTickets: 10, totalDevices: 5 };
      apiServiceSpy.getDashboardStats.and.returnValue(of(mockStats));

      component.loadStats();

      expect(component.stats()).toEqual(mockStats);
      expect(component.loading()).toBe(false);
    });

    it('should handle error when loading stats', () => {
      apiServiceSpy.getDashboardStats.and.returnValue(throwError(() => new Error('fail')));

      component.loadStats();

      expect(component.loading()).toBe(false);
      expect(component.stats()).toBeNull();
    });
  });

  describe('barWidth', () => {
    it('should calculate bar width correctly', () => {
      const map = { a: 10, b: 5, c: 2 };
      expect(component.barWidth(10, map)).toBe(100);
      expect(component.barWidth(5, map)).toBe(50);
      expect(component.barWidth(2, map)).toBe(20);
    });

    it('should handle empty map', () => {
      expect(component.barWidth(5, {})).toBe(500);
    });

    it('should handle null/undefined map', () => {
      expect(component.barWidth(5, null as any)).toBe(500);
      expect(component.barWidth(5, undefined as any)).toBe(500);
    });

    it('should return 0 for zero count', () => {
      const map = { a: 10 };
      expect(component.barWidth(0, map)).toBe(0);
    });
  });

  describe('priorityLabel', () => {
    it('should return French labels for known priorities', () => {
      expect(component.priorityLabel('low')).toBe('Faible');
      expect(component.priorityLabel('medium')).toBe('Moyen');
      expect(component.priorityLabel('high')).toBe('Eleve');
      expect(component.priorityLabel('urgent')).toBe('Urgent');
    });

    it('should return raw key for unknown priority', () => {
      expect(component.priorityLabel('unknown')).toBe('unknown');
    });
  });

  describe('priorityColor', () => {
    it('should return correct CSS classes for priorities', () => {
      expect(component.priorityColor('low')).toContain('emerald');
      expect(component.priorityColor('medium')).toContain('sky');
      expect(component.priorityColor('high')).toContain('amber');
      expect(component.priorityColor('urgent')).toContain('rose');
    });

    it('should return default color for unknown priority', () => {
      expect(component.priorityColor('unknown')).toContain('gray');
    });
  });

  describe('issueTypeLabel', () => {
    it('should return French labels for known issue types', () => {
      expect(component.issueTypeLabel('damaged')).toBe('Endommage');
      expect(component.issueTypeLabel('destroyed')).toBe('Detruit');
      expect(component.issueTypeLabel('malfunction')).toBe('Dysfonctionnement');
      expect(component.issueTypeLabel('other')).toBe('Autre');
    });

    it('should return raw key for unknown type', () => {
      expect(component.issueTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('issueTypeColor', () => {
    it('should return correct CSS classes for issue types', () => {
      expect(component.issueTypeColor('damaged')).toContain('amber');
      expect(component.issueTypeColor('destroyed')).toContain('rose');
      expect(component.issueTypeColor('malfunction')).toContain('violet');
      expect(component.issueTypeColor('other')).toContain('gray');
    });

    it('should return default color for unknown type', () => {
      expect(component.issueTypeColor('unknown')).toContain('gray');
    });
  });

  describe('deviceTypeLabel', () => {
    it('should return correct French labels for device types', () => {
      expect(component.deviceTypeLabel('Laptop')).toBe('Laptop');
      expect(component.deviceTypeLabel('Desktop')).toBe('Desktop');
      expect(component.deviceTypeLabel('Mobile')).toBe('Mobile');
      expect(component.deviceTypeLabel('Tablet')).toBe('Tablette');
      expect(component.deviceTypeLabel('Printer')).toBe('Imprimante');
      expect(component.deviceTypeLabel('Scanner')).toBe('Scanner');
      expect(component.deviceTypeLabel('Monitor')).toBe('Moniteur');
      expect(component.deviceTypeLabel('Router')).toBe('Routeur');
      expect(component.deviceTypeLabel('Switch')).toBe('Switch');
      expect(component.deviceTypeLabel('Access Point')).toBe("Point d'acces");
      expect(component.deviceTypeLabel('Camera')).toBe('Camera');
      expect(component.deviceTypeLabel('Projecteur')).toBe('Projecteur');
    });

    it('should return raw key for unknown device type', () => {
      expect(component.deviceTypeLabel('Unknown')).toBe('Unknown');
    });
  });

  describe('deviceTypeColor', () => {
    it('should return correct CSS classes for device types', () => {
      expect(component.deviceTypeColor('Laptop')).toContain('blue');
      expect(component.deviceTypeColor('Desktop')).toContain('violet');
      expect(component.deviceTypeColor('Mobile')).toContain('emerald');
      expect(component.deviceTypeColor('Tablet')).toContain('sky');
      expect(component.deviceTypeColor('Printer')).toContain('amber');
      expect(component.deviceTypeColor('Scanner')).toContain('orange');
      expect(component.deviceTypeColor('Monitor')).toContain('indigo');
      expect(component.deviceTypeColor('Router')).toContain('teal');
      expect(component.deviceTypeColor('Switch')).toContain('cyan');
      expect(component.deviceTypeColor('Access Point')).toContain('pink');
      expect(component.deviceTypeColor('Camera')).toContain('rose');
      expect(component.deviceTypeColor('Projecteur')).toContain('purple');
    });

    it('should return default color for unknown type', () => {
      expect(component.deviceTypeColor('Unknown')).toContain('gray');
    });
  });

  describe('statusBadge', () => {
    it('should return correct badge classes for statuses', () => {
      expect(component.statusBadge('open')).toContain('emerald');
      expect(component.statusBadge('in_progress')).toContain('sky');
      expect(component.statusBadge('resolved')).toContain('violet');
      expect(component.statusBadge('closed')).toContain('gray');
    });

    it('should return default badge for unknown status', () => {
      expect(component.statusBadge('unknown')).toContain('gray');
    });
  });

  describe('statusLabel', () => {
    it('should return French labels for statuses', () => {
      expect(component.statusLabel('open')).toBe('Ouvert');
      expect(component.statusLabel('in_progress')).toBe('En cours');
      expect(component.statusLabel('resolved')).toBe('Resolu');
      expect(component.statusLabel('closed')).toBe('Ferme');
    });

    it('should return raw key for unknown status', () => {
      expect(component.statusLabel('unknown')).toBe('unknown');
    });
  });

  describe('priorityBadge', () => {
    it('should return correct badge classes', () => {
      expect(component.priorityBadge('low')).toContain('emerald');
      expect(component.priorityBadge('medium')).toContain('sky');
      expect(component.priorityBadge('high')).toContain('amber');
      expect(component.priorityBadge('urgent')).toContain('rose');
    });

    it('should return default badge for unknown priority', () => {
      expect(component.priorityBadge('unknown')).toContain('gray');
    });
  });

  describe('timeAgo', () => {
    it('should return "a l\'instant" for very recent dates', () => {
      const now = new Date().toISOString();
      expect(component.timeAgo(now)).toBe("a l'instant");
    });

    it('should return minutes for older dates', () => {
      const date = new Date(Date.now() - 5 * 60000).toISOString();
      expect(component.timeAgo(date)).toBe('il y a 5 min');
    });

    it('should return hours for dates within a day', () => {
      const date = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(component.timeAgo(date)).toBe('il y a 3h');
    });

    it('should return days for older dates', () => {
      const date = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(component.timeAgo(date)).toBe('il y a 2j');
    });
  });

  describe('objectKeys', () => {
    it('should return object keys', () => {
      const obj = { a: 1, b: 2 };
      expect(component.objectKeys(obj)).toEqual(['a', 'b']);
    });

    it('should return empty array for null', () => {
      expect(component.objectKeys(null)).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(component.objectKeys(undefined)).toEqual([]);
    });

    it('should return empty array for empty object', () => {
      expect(component.objectKeys({})).toEqual([]);
    });
  });

  describe('signals', () => {
    it('should read user role from localStorage', () => {
      localStorage.setItem('user_role', 'ADMIN');
      const comp = TestBed.createComponent(EcommerceComponent).componentInstance;
      expect(comp.userRole()).toBe('ADMIN');
    });

    it('should default user role to empty string', () => {
      const comp = TestBed.createComponent(EcommerceComponent).componentInstance;
      expect(comp.userRole()).toBe('');
    });

    it('should read user name from localStorage', () => {
      localStorage.setItem('user_prenom', 'John');
      const comp = TestBed.createComponent(EcommerceComponent).componentInstance;
      expect(comp.userName()).toBe('John');
    });
  });

  describe('computed signals', () => {
    it('isAdmin should return true for ADMIN', () => {
      component.userRole.set('ADMIN');
      expect(component.isAdmin()).toBe(true);
    });

    it('isIT should return true for IT', () => {
      component.userRole.set('IT');
      expect(component.isIT()).toBe(true);
    });

    it('isConsultant should return true for CONSULTANT', () => {
      component.userRole.set('CONSULTANT');
      expect(component.isConsultant()).toBe(true);
    });

    it('isAdmin should return false for non-ADMIN', () => {
      component.userRole.set('IT');
      expect(component.isAdmin()).toBe(false);
    });

    it('isIT should return false for non-IT', () => {
      component.userRole.set('CONSULTANT');
      expect(component.isIT()).toBe(false);
    });

    it('isConsultant should return false for non-CONSULTANT', () => {
      component.userRole.set('ADMIN');
      expect(component.isConsultant()).toBe(false);
    });
  });
});
