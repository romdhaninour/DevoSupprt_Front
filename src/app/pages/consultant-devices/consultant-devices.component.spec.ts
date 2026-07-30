import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ConsultantDevicesComponent } from './consultant-devices.component';
import { ApiService } from '../../services/api.service';
import { provideRouter } from '@angular/router';

describe('ConsultantDevicesComponent', () => {
  let component: ConsultantDevicesComponent;
  let fixture: ComponentFixture<ConsultantDevicesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockAssignedDevice = {
    id: '1',
    name: 'Laptop 1',
    type: 'Laptop',
    department: 'IT',
    owner: 'John Doe',
    location: 'Office',
    serialNumber: 'SN123',
    assignedAt: '2024-01-15T10:30:00Z',
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getAssignedDevices',
      'createTicket',
    ]);

    await TestBed.configureTestingModule({
      imports: [ConsultantDevicesComponent],
      providers: [{ provide: ApiService, useValue: spy }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultantDevicesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => localStorage.clear());

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
    expect(component.ticketLoading()).toBe(false);
    expect(component.ticketError()).toBeNull();
  });

  it('should expose Math for template usage', () => {
    expect(component['Math']).toBe(Math);
  });

  it('should load assigned devices on init', () => {
    apiService.getAssignedDevices.and.returnValue(
      of({
        devices: [
          {
            _id: '1',
            name: 'Laptop 1',
            type: 'Laptop',
            department: 'IT',
            owner: 'John Doe',
            location: 'Office',
            serialNumber: 'SN123',
            assignedAt: '2024-01-01',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      })
    );

    component.loadAssignedForUser();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.devices().length).toBe(1);
    expect(component.totalCount()).toBe(1);
  });

  it('should map device data correctly from API', () => {
    apiService.getAssignedDevices.and.returnValue(
      of({
        devices: [
          {
            _id: 'abc',
            name: 'Desktop 1',
            type: 'Desktop',
            department: 'HR',
            owner: 'Jane',
            location: 'Floor 2',
            serialNumber: 'SN999',
            assignedAt: '2024-06-01',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      })
    );

    component.loadAssignedForUser();
    fixture.detectChanges();

    expect(component.devices()[0].id).toBe('abc');
    expect(component.devices()[0].name).toBe('Desktop 1');
    expect(component.devices()[0].type).toBe('Desktop');
  });

  it('should handle missing optional fields with defaults', () => {
    apiService.getAssignedDevices.and.returnValue(
      of({
        devices: [
          {
            _id: '1',
            name: null,
            type: null,
            department: null,
            owner: null,
            location: null,
            serialNumber: null,
            assignedAt: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      })
    );

    component.loadAssignedForUser();
    fixture.detectChanges();

    expect(component.devices()[0].name).toBe('Appareil sans nom');
    expect(component.devices()[0].type).toBe('Type non défini');
    expect(component.devices()[0].serialNumber).toBe('N/A');
    expect(component.devices()[0].location).toBe('À définir');
  });

  it('should set empty devices on load error', () => {
    apiService.getAssignedDevices.and.returnValue(
      throwError(() => new Error('fail'))
    );

    component.loadAssignedForUser();
    fixture.detectChanges();

    expect(component.devices()).toEqual([]);
    expect(component.totalCount()).toBe(0);
    expect(component.loading()).toBe(false);
  });

  it('should format assigned date correctly', () => {
    const formatted = component.formatAssignedAt('2024-01-15T10:30:00Z');
    expect(formatted).toContain('2024');
    expect(formatted).toContain('15');
  });

  it('should return "À définir" for null assigned date', () => {
    expect(component.formatAssignedAt(null)).toBe('À définir');
  });

  it('should return "À définir" for undefined assigned date', () => {
    expect(component.formatAssignedAt(undefined)).toBe('À définir');
  });

  it('should return "Date invalide" for invalid date string', () => {
    expect(component.formatAssignedAt('not-a-date')).toBe('Date invalide');
  });

  it('should display value when provided', () => {
    expect(component.displayValue('test value')).toBe('test value');
  });

  it('should return "À définir" for empty value', () => {
    expect(component.displayValue('')).toBe('À définir');
  });

  it('should return "À définir" for whitespace-only value', () => {
    expect(component.displayValue('   ')).toBe('À définir');
  });

  it('should return "À définir" for null value', () => {
    expect(component.displayValue(null)).toBe('À définir');
  });

  it('should return "À définir" for undefined value', () => {
    expect(component.displayValue(undefined)).toBe('À définir');
  });

  it('should calculate total pages correctly', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    expect(component.totalPages()).toBe(2);
  });

  it('should return minimum 1 for totalPages', () => {
    component.totalCount.set(0);
    component.itemsPerPage.set(10);
    expect(component.totalPages()).toBe(1);
  });

  it('should return page numbers for small total', () => {
    component.totalCount.set(5);
    component.itemsPerPage.set(10);
    expect(component.getPageNumbers()).toEqual([1]);
  });

  it('should return page numbers for total under 7 pages', () => {
    component.totalCount.set(50);
    component.itemsPerPage.set(10);
    const pages = component.getPageNumbers();
    expect(pages).toEqual([1, 2, 3, 4, 5]);
  });

  it('should return page numbers with ellipsis for large total (current near start)', () => {
    component.totalCount.set(200);
    component.itemsPerPage.set(10);
    component.currentPage.set(2);
    const pages = component.getPageNumbers();
    expect(pages).toContain('...');
    expect(pages).toContain(1);
    expect(pages).toContain(20);
  });

  it('should return page numbers with ellipsis for large total (current near end)', () => {
    component.totalCount.set(200);
    component.itemsPerPage.set(10);
    component.currentPage.set(19);
    const pages = component.getPageNumbers();
    expect(pages).toContain('...');
    expect(pages).toContain(1);
    expect(pages).toContain(20);
  });

  it('should return page numbers with ellipsis for large total (current in middle)', () => {
    component.totalCount.set(200);
    component.itemsPerPage.set(10);
    component.currentPage.set(10);
    const pages = component.getPageNumbers();
    expect(pages).toContain('...');
    expect(pages).toContain(1);
    expect(pages).toContain(10);
    expect(pages).toContain(20);
  });

  it('should go to valid page', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    apiService.getAssignedDevices.and.returnValue(
      of({ devices: [], total: 20, page: 2, limit: 10 })
    );

    component.goToPage(2);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
    expect(apiService.getAssignedDevices).toHaveBeenCalled();
  });

  it('should not go to invalid page beyond total', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    const initialPage = component.currentPage();

    component.goToPage(100);

    expect(component.currentPage()).toBe(initialPage);
    expect(apiService.getAssignedDevices).not.toHaveBeenCalled();
  });

  it('should not go to page 0', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    const initialPage = component.currentPage();

    component.goToPage(0);

    expect(component.currentPage()).toBe(initialPage);
  });

  it('should not go to NaN page from string', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    const initialPage = component.currentPage();

    component.goToPage('invalid' as any);

    expect(component.currentPage()).toBe(initialPage);
  });

  it('should handle goToPage with numeric string', () => {
    component.totalCount.set(20);
    component.itemsPerPage.set(10);
    apiService.getAssignedDevices.and.returnValue(
      of({ devices: [], total: 20, page: 2, limit: 10 })
    );

    component.goToPage('2' as any);

    expect(component.currentPage()).toBe(2);
  });

  it('should reset page to 1 on search change', () => {
    component.currentPage.set(3);
    apiService.getAssignedDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 10 })
    );

    component.onSearchChange();
    fixture.detectChanges();

    expect(component.currentPage()).toBe(1);
    expect(apiService.getAssignedDevices).toHaveBeenCalled();
  });

  it('should open ticket modal', () => {
    component.openTicketModal(mockAssignedDevice);

    expect(component.showTicketModal()).toBe(true);
    expect(component.ticketForm().deviceId).toBe('1');
    expect(component.ticketForm().title).toBe('');
    expect(component.ticketForm().description).toBe('');
    expect(component.ticketForm().issueType).toBe('damaged');
    expect(component.ticketForm().priority).toBe('medium');
  });

  it('should close ticket modal and reset form', () => {
    component.showTicketModal.set(true);
    component.ticketForm.set({
      title: 'Test',
      description: 'Desc',
      deviceId: '1',
      issueType: 'damaged' as any,
      priority: 'high' as any,
    });
    component.ticketError.set('error');

    component.closeTicketModal();

    expect(component.showTicketModal()).toBe(false);
    expect(component.ticketForm().title).toBe('');
    expect(component.ticketForm().deviceId).toBe('');
    expect(component.ticketError()).toBeNull();
  });

  it('should set ticket error when required fields are missing', () => {
    component.ticketForm.set({
      title: '',
      description: '',
      deviceId: '',
      issueType: 'damaged' as any,
      priority: 'medium' as any,
    });

    component.createTicket();

    expect(component.ticketError()).toBe(
      'Veuillez remplir tous les champs obligatoires'
    );
    expect(apiService.createTicket).not.toHaveBeenCalled();
  });

  it('should create ticket successfully', (done) => {
    component.ticketForm.set({
      title: 'Broken Screen',
      description: 'Screen cracked',
      deviceId: '1',
      issueType: 'damaged' as any,
      priority: 'high' as any,
    });
    apiService.createTicket.and.returnValue(of({}));

    component.createTicket().then(() => {
      expect(apiService.createTicket).toHaveBeenCalled();
      expect(component.showTicketModal()).toBe(false);
      expect(component.ticketLoading()).toBe(false);
      done();
    });
  });

  it('should handle ticket creation error', (done) => {
    component.ticketForm.set({
      title: 'Broken Screen',
      description: 'Screen cracked',
      deviceId: '1',
      issueType: 'damaged' as any,
      priority: 'high' as any,
    });
    apiService.createTicket.and.returnValue(
      throwError(() => ({ error: { message: 'Creation failed' } }))
    );

    component.createTicket().then(() => {
      expect(component.ticketError()).toBe('Creation failed');
      expect(component.ticketLoading()).toBe(false);
      done();
    });
  });

  it('should set default error message on ticket creation failure', (done) => {
    component.ticketForm.set({
      title: 'Broken Screen',
      description: 'Screen cracked',
      deviceId: '1',
      issueType: 'damaged' as any,
      priority: 'high' as any,
    });
    apiService.createTicket.and.returnValue(
      throwError(() => ({ error: {} }))
    );

    component.createTicket().then(() => {
      expect(component.ticketError()).toBe('Failed to create ticket');
      expect(component.ticketLoading()).toBe(false);
      done();
    });
  });
});
