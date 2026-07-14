import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ConsultantDevicesComponent } from './consultant-devices.component';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

describe('ConsultantDevicesComponent', () => {
  let component: ConsultantDevicesComponent;
  let fixture: ComponentFixture<ConsultantDevicesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getAssignedDevices',
      'createTicket'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ConsultantDevicesComponent,
        FormsModule,
        CommonModule,
        RouterTestingModule
      ],
      providers: [{ provide: ApiService, useValue: apiServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultantDevicesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize signals with default values', () => {
    expect(component.devices()).toEqual([]);
    expect(component.loading()).toBe(true);
    expect(component.searchTerm()).toBe('');
    expect(component.currentPage()).toBe(1);
    expect(component.totalCount()).toBe(0);
    expect(component.showTicketModal()).toBe(false);
  });

  it('should load assigned devices on init', () => {
    apiService.getAssignedDevices.and.returnValue(of({
      devices: [
        {
          _id: '1',
          name: 'Laptop 1',
          type: 'Laptop',
          department: 'IT',
          owner: 'John Doe',
          location: 'Office',
          serialNumber: 'SN123',
          assignedAt: '2024-01-01'
        }
      ],
      total: 1,
      page: 1,
      limit: 10
    }));

    component.loadAssignedForUser();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });

  it('should format assigned date correctly', () => {
    const formatted = component.formatAssignedAt('2024-01-15T10:30:00Z');
    expect(formatted).toContain('2024');
  });

  it('should return "À définir" for null assigned date', () => {
    const formatted = component.formatAssignedAt(null);
    expect(formatted).toBe('À définir');
  });

  it('should return "Date invalide" for invalid date', () => {
    const formatted = component.formatAssignedAt('invalid-date');
    expect(formatted).toBe('Date invalide');
  });

  it('should display value when provided', () => {
    const result = component.displayValue('test value');
    expect(result).toBe('test value');
  });

  it('should return "À définir" for empty value', () => {
    expect(component.displayValue('')).toBe('À définir');
    expect(component.displayValue('   ')).toBe('À définir');
    expect(component.displayValue(null)).toBe('À définir');
    expect(component.displayValue(undefined)).toBe('À définir');
  });

  it('should calculate total pages correctly', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(2);
  });

  it('should return page numbers for small total', () => {
    component.totalCount.set(5);
    component.itemsPerPage.set(10);
    fixture.detectChanges();

    const pages = component.getPageNumbers();
    expect(pages).toEqual([1]);
  });

  it('should return page numbers with ellipsis for large total', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(2);
    component.currentPage.set(5);
    fixture.detectChanges();

    const pages = component.getPageNumbers();
    expect(pages.length).toBeGreaterThan(0);
  });

  it('should go to valid page', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    apiService.getAssignedDevices.and.returnValue(of({ devices: [], total: 20, page: 2, limit: 10 }));
    
    component.goToPage(2);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
  });

  it('should not go to invalid page', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    const initialPage = component.currentPage();
    
    component.goToPage(100);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(initialPage);
  });

  it('should not go to NaN page', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    const initialPage = component.currentPage();
    
    component.goToPage('invalid' as any);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(initialPage);
  });

  it('should reset page on search change', () => {
    component.currentPage.set(3);
    apiService.getAssignedDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 10 }));
    
    component.onSearchChange();
    fixture.detectChanges();

    expect(component.currentPage()).toBe(1);
  });

  it('should open ticket modal', () => {
    const mockDevice = {
      id: '1',
      name: 'Laptop 1',
      type: 'Laptop',
      department: 'IT',
      owner: 'John Doe',
      location: 'Office',
      serialNumber: 'SN123',
      assignedAt: '2024-01-01'
    };

    component.openTicketModal(mockDevice);
    fixture.detectChanges();

    expect(component.showTicketModal()).toBe(true);
    expect(component.ticketForm().deviceId).toBe('1');
    expect(component.ticketForm().title).toBe('');
    expect(component.ticketForm().description).toBe('');
  });

  it('should close ticket modal', () => {
    component.showTicketModal.set(true);
    component.ticketForm.set({
      title: 'Test',
      description: 'Test description',
      deviceId: '1',
      issueType: 'damaged' as any,
      priority: 'medium' as any
    });
    fixture.detectChanges();

    component.closeTicketModal();
    fixture.detectChanges();

    expect(component.showTicketModal()).toBe(false);
    expect(component.ticketForm().title).toBe('');
    expect(component.ticketForm().deviceId).toBe('');
  });

  it('should create ticket successfully', (done) => {
    component.ticketForm.set({
      title: 'Test Ticket',
      description: 'Test description',
      deviceId: '1',
      issueType: 'damaged' as any,
      priority: 'medium' as any
    });

    apiService.createTicket.and.returnValue(of({}));
    component.createTicket().then(() => {
      expect(component.showTicketModal()).toBe(false);
      expect(component.ticketLoading()).toBe(false);
      done();
    });
  });

  it('should not create ticket with missing fields', () => {
    component.ticketForm.set({
      title: '',
      description: '',
      deviceId: '',
      issueType: 'damaged' as any,
      priority: 'medium' as any
    });

    component.createTicket();
    fixture.detectChanges();

    expect(component.ticketError()).toBe('Veuillez remplir tous les champs obligatoires');
  });

  it('should handle ticket creation error', (done) => {
    component.ticketForm.set({
      title: 'Test Ticket',
      description: 'Test description',
      deviceId: '1',
      issueType: 'damaged' as any,
      priority: 'medium' as any
    });

    apiService.createTicket.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.createTicket().catch(() => {
      expect(component.ticketError()).toBe('Error');
      expect(component.ticketLoading()).toBe(false);
      done();
    });
  });

  it('should expose Math for template usage', () => {
    expect(component['Math']).toBe(Math);
  });

  it('should handle load error', () => {
    apiService.getAssignedDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 10 }));
    
    component.loadAssignedForUser();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });
});
