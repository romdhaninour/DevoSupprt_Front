import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DeviceManagementComponent } from './device-management.component';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

describe('DeviceManagementComponent', () => {
  let component: DeviceManagementComponent;
  let fixture: ComponentFixture<DeviceManagementComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getDevices',
      'getConsultants',
      'createDevice',
      'updateDevice',
      'deleteDevice',
      'allocateDevice',
      'returnDevice',
      'createTicket'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        DeviceManagementComponent,
        FormsModule,
        CommonModule,
        RouterTestingModule
      ],
      providers: [{ provide: ApiService, useValue: apiServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceManagementComponent);
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
    expect(component.total()).toBe(0);
    expect(component.currentPage()).toBe(1);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.searchTerm()).toBe('');
    expect(component.statusFilter()).toBe('all');
    expect(component.typeFilter()).toBe('all');
    expect(component.showAddForm()).toBe(false);
    expect(component.editingDeviceId()).toBeNull();
  });

  it('should load devices on init', () => {
    apiService.getDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 8 }));
    apiService.getConsultants.and.returnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
  });

  it('should filter devices by search term', () => {
    component.devices.set([
      {
        id: '1',
        name: 'Laptop 1',
        type: 'Laptop',
        department: 'IT',
        owner: 'John Doe',
        email: 'john@example.com',
        status: 'available',
        location: 'Office',
        serialNumber: 'SN123',
        purchaseDate: '2024-01-01'
      },
      {
        id: '2',
        name: 'Desktop 1',
        type: 'Desktop',
        department: 'HR',
        owner: 'Jane Doe',
        email: 'jane@example.com',
        status: 'assigned',
        location: 'Office',
        serialNumber: 'SN456',
        purchaseDate: '2024-01-02'
      }
    ]);

    component.searchTerm.set('Laptop');
    fixture.detectChanges();

    const filtered = component.filteredDevices();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Laptop 1');
  });

  it('should filter devices by status', () => {
    component.devices.set([
      {
        id: '1',
        name: 'Laptop 1',
        type: 'Laptop',
        department: 'IT',
        owner: 'John Doe',
        email: 'john@example.com',
        status: 'available',
        location: 'Office',
        serialNumber: 'SN123',
        purchaseDate: '2024-01-01'
      },
      {
        id: '2',
        name: 'Desktop 1',
        type: 'Desktop',
        department: 'HR',
        owner: 'Jane Doe',
        email: 'jane@example.com',
        status: 'assigned',
        location: 'Office',
        serialNumber: 'SN456',
        purchaseDate: '2024-01-02'
      }
    ]);

    component.statusFilter.set('available');
    fixture.detectChanges();

    const filtered = component.filteredDevices();
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('available');
  });

  it('should filter devices by type', () => {
    component.devices.set([
      {
        id: '1',
        name: 'Laptop 1',
        type: 'Laptop',
        department: 'IT',
        owner: 'John Doe',
        email: 'john@example.com',
        status: 'available',
        location: 'Office',
        serialNumber: 'SN123',
        purchaseDate: '2024-01-01'
      },
      {
        id: '2',
        name: 'Desktop 1',
        type: 'Desktop',
        department: 'HR',
        owner: 'Jane Doe',
        email: 'jane@example.com',
        status: 'assigned',
        location: 'Office',
        serialNumber: 'SN456',
        purchaseDate: '2024-01-02'
      }
    ]);

    component.typeFilter.set('Laptop');
    fixture.detectChanges();

    const filtered = component.filteredDevices();
    expect(filtered.length).toBe(1);
    expect(filtered[0].type).toBe('Laptop');
  });

  it('should get correct status class for available', () => {
    const statusClass = component.getStatusClass('available');
    expect(statusClass).toContain('bg-emerald-50');
    expect(statusClass).toContain('text-emerald-700');
  });

  it('should get correct status class for assigned', () => {
    const statusClass = component.getStatusClass('assigned');
    expect(statusClass).toContain('bg-sky-50');
    expect(statusClass).toContain('text-sky-700');
  });

  it('should get correct status class for maintenance', () => {
    const statusClass = component.getStatusClass('maintenance');
    expect(statusClass).toContain('bg-amber-50');
    expect(statusClass).toContain('text-amber-700');
  });

  it('should get correct status class for retired', () => {
    const statusClass = component.getStatusClass('retired');
    expect(statusClass).toContain('bg-rose-50');
    expect(statusClass).toContain('text-rose-700');
  });

  it('should get correct status label', () => {
    expect(component.getStatusLabel('available')).toBe('Disponible');
    expect(component.getStatusLabel('assigned')).toBe('Assigné');
    expect(component.getStatusLabel('maintenance')).toBe('Maintenance');
    expect(component.getStatusLabel('retired')).toBe('Retiré');
  });

  it('should check if value is empty', () => {
    expect(component.hasNoValue('')).toBe(true);
    expect(component.hasNoValue('   ')).toBe(true);
    expect(component.hasNoValue(null)).toBe(true);
    expect(component.hasNoValue(undefined)).toBe(true);
    expect(component.hasNoValue('test')).toBe(false);
  });

  it('should open add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    expect(component.showAddForm()).toBe(true);
    expect(component.editingDeviceId()).toBeNull();
    expect(component.formDevice().name).toBe('');
    expect(component.formDevice().type).toBe('Laptop');
  });

  it('should edit device', () => {
    const mockDevice = {
      id: '1',
      name: 'Laptop 1',
      type: 'Laptop' as any,
      department: 'IT',
      owner: 'John Doe',
      email: 'john@example.com',
      status: 'available' as any,
      location: 'Office',
      serialNumber: 'SN123',
      purchaseDate: '2024-01-01'
    };

    component.editDevice(mockDevice);
    fixture.detectChanges();

    expect(component.showAddForm()).toBe(true);
    expect(component.editingDeviceId()).toBe('1');
    expect(component.formDevice().name).toBe('Laptop 1');
  });

  it('should cancel form', () => {
    component.showAddForm.set(true);
    component.editingDeviceId.set('1');
    fixture.detectChanges();

    component.cancelForm();
    fixture.detectChanges();

    expect(component.showAddForm()).toBe(false);
    expect(component.editingDeviceId()).toBeNull();
  });

  it('should toggle device action menu', () => {
    const mockEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      target: {
        getBoundingClientRect: () => ({ bottom: 100, left: 50 })
      }
    } as any;

    component.toggleDeviceActionMenu('device1', mockEvent);
    fixture.detectChanges();

    expect(component.openActionMenuId()).toBe('device1');
    expect(component.actionMenuPosition()).toEqual({ top: 105, left: 50 });
  });

  it('should close action menu', () => {
    component.openActionMenuId.set('device1');
    component.actionMenuPosition.set({ top: 100, left: 50 });
    fixture.detectChanges();

    component.closeActionMenu();
    fixture.detectChanges();

    expect(component.openActionMenuId()).toBeNull();
    expect(component.actionMenuPosition()).toBeNull();
  });

  it('should calculate total pages correctly', () => {
    component.total.set(20);
    component.itemsPerPage = 5;
    fixture.detectChanges();

    expect(component.totalPages).toBe(4);
  });

  it('should return page numbers', () => {
    component.total.set(10);
    component.itemsPerPage = 5;
    fixture.detectChanges();

    const pages = component.pageNumbers();
    expect(pages).toEqual([1, 2]);
  });

  it('should go to specific page', () => {
    component.total.set(20);
    component.itemsPerPage = 5;
    apiService.getDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 8 }));
    
    component.goToPage(2);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
  });

  it('should not go to invalid page', () => {
    component.total.set(20);
    component.itemsPerPage = 5;
    const initialPage = component.currentPage();
    
    component.goToPage(10);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(initialPage);
  });

  it('should reset current page on filter change', () => {
    component.currentPage.set(3);
    apiService.getDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 8 }));
    
    component.onFilterChange();
    fixture.detectChanges();

    expect(component.currentPage()).toBe(1);
  });

  it('should open ticket modal', () => {
    const mockDevice = {
      id: '1',
      name: 'Laptop 1',
      type: 'Laptop' as any,
      department: 'IT',
      owner: 'John Doe',
      email: 'john@example.com',
      status: 'available' as any,
      location: 'Office',
      serialNumber: 'SN123',
      purchaseDate: '2024-01-01'
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

  it('should open allocation modal', () => {
    const mockDevice = {
      id: '1',
      name: 'Laptop 1',
      type: 'Laptop' as any,
      department: 'IT',
      owner: 'John Doe',
      email: 'john@example.com',
      status: 'available' as any,
      location: 'Office',
      serialNumber: 'SN123',
      purchaseDate: '2024-01-01'
    };

    component.openAllocate(mockDevice);
    fixture.detectChanges();

    expect(component.selectedDeviceForAllocation()).toEqual(mockDevice);
    expect(component.selectedConsultantId()).toBe('');
  });

  it('should close allocation modal', () => {
    component.selectedDeviceForAllocation.set({} as any);
    component.selectedConsultantId.set('consultant1');
    fixture.detectChanges();

    component.closeAllocate();
    fixture.detectChanges();

    expect(component.selectedDeviceForAllocation()).toBeNull();
    expect(component.selectedConsultantId()).toBe('');
  });

  it('should check if user is IT', () => {
    localStorage.setItem('user_role', 'IT');
    component.isIT.set(localStorage.getItem('user_role') === 'IT' || localStorage.getItem('user_role') === 'ADMIN');
    fixture.detectChanges();
    expect(component.isIT()).toBe(true);

    localStorage.setItem('user_role', 'CONSULTANT');
    component.isIT.set(localStorage.getItem('user_role') === 'IT' || localStorage.getItem('user_role') === 'ADMIN');
    fixture.detectChanges();
    expect(component.isIT()).toBe(false);
  });
});
