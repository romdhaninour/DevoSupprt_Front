import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeviceManagementComponent } from './device-management.component';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DeviceManagementComponent', () => {
  let component: DeviceManagementComponent;
  let fixture: ComponentFixture<DeviceManagementComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockDevice = {
    id: '1',
    name: 'Laptop 1',
    type: 'Laptop' as const,
    department: 'IT',
    owner: 'John Doe',
    email: 'john@example.com',
    status: 'available' as const,
    location: 'Office',
    serialNumber: 'SN123',
    purchaseDate: '2024-01-01',
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getDevices',
      'getConsultants',
      'createDevice',
      'updateDevice',
      'deleteDevice',
      'allocateDevice',
      'updateDeviceStatus',
      'importDevices',
      'exportDevices',
      'createTicket',
      'getDeviceTypes',
    ]);

    await TestBed.configureTestingModule({
      imports: [DeviceManagementComponent],
      providers: [{ provide: ApiService, useValue: spy }, { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceManagementComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    apiService.getDeviceTypes.and.returnValue(of([]));
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize signals with default values', () => {
    expect(component.devices()).toEqual([]);
    expect(component.consultants()).toEqual([]);
    expect(component.total()).toBe(0);
    expect(component.currentPage()).toBe(1);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.searchTerm()).toBe('');
    expect(component.statusFilter()).toBe('all');
    expect(component.typeFilter()).toBe('all');
    expect(component.showAddForm()).toBe(false);
    expect(component.editingDeviceId()).toBeNull();
    expect(component.selectedDeviceForAllocation()).toBeNull();
    expect(component.selectedConsultantId()).toBe('');
    expect(component.allocateLoading()).toBe(false);
    expect(component.openActionMenuId()).toBeNull();
    expect(component.actionMenuPosition()).toBeNull();
    expect(component.showTicketModal()).toBe(false);
    expect(component.ticketLoading()).toBe(false);
    expect(component.ticketError()).toBeNull();
  });

  it('should have itemsPerPage of 4', () => {
    expect(component.itemsPerPage).toBe(4);
  });

  it('should load devices and consultants on init', () => {
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 4 })
    );
    apiService.getConsultants.and.returnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();

    expect(apiService.getDevices).toHaveBeenCalled();
    expect(apiService.getConsultants).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('should map device data from API response correctly', () => {
    apiService.getDevices.and.returnValue(
      of({
        devices: [
          {
            _id: 'abc123',
            name: 'Laptop 1',
            type: 'Laptop',
            department: 'IT',
            owner: 'John',
            email: 'john@test.com',
            status: 'available',
            location: 'Office',
            serialNumber: 'SN001',
            purchaseDate: '2024-01-01',
            assignedTo: null,
            assignedAt: null,
            assignedBy: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 4,
      })
    );
    apiService.getConsultants.and.returnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.devices().length).toBe(1);
    expect(component.devices()[0].id).toBe('abc123');
    expect(component.devices()[0].name).toBe('Laptop 1');
    expect(component.total()).toBe(1);
  });

  it('should set empty devices on load error', () => {
    apiService.getDevices.and.returnValue(throwError(() => new Error('fail')));
    apiService.getConsultants.and.returnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.devices()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('should set empty consultants on load error', () => {
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 4 })
    );
    apiService.getConsultants.and.returnValue(
      throwError(() => new Error('fail'))
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.consultants()).toEqual([]);
  });

  it('should filter devices by search term', () => {
    component.devices.set([
      { ...mockDevice, id: '1', name: 'Laptop 1' },
      { ...mockDevice, id: '2', name: 'Desktop 1', type: 'Desktop', status: 'assigned' },
    ]);

    component.searchTerm.set('Laptop');
    const filtered = component.filteredDevices();

    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Laptop 1');
  });

  it('should filter devices by status', () => {
    component.devices.set([
      { ...mockDevice, id: '1', status: 'available' },
      { ...mockDevice, id: '2', status: 'assigned' },
    ]);

    component.statusFilter.set('available');
    const filtered = component.filteredDevices();

    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('available');
  });

  it('should filter devices by type', () => {
    component.devices.set([
      { ...mockDevice, id: '1', type: 'Laptop' },
      { ...mockDevice, id: '2', type: 'Desktop', status: 'assigned' },
    ]);

    component.typeFilter.set('Laptop');
    const filtered = component.filteredDevices();

    expect(filtered.length).toBe(1);
    expect(filtered[0].type).toBe('Laptop');
  });

  it('should return all devices when no filters applied', () => {
    component.devices.set([
      { ...mockDevice, id: '1' },
      { ...mockDevice, id: '2', type: 'Desktop', status: 'assigned' },
    ]);

    component.searchTerm.set('');
    component.statusFilter.set('all');
    component.typeFilter.set('all');

    expect(component.filteredDevices().length).toBe(2);
  });

  it('should get correct status class for available', () => {
    const cls = component.getStatusClass('available');
    expect(cls).toContain('bg-emerald-50');
    expect(cls).toContain('text-emerald-700');
  });

  it('should get correct status class for assigned', () => {
    const cls = component.getStatusClass('assigned');
    expect(cls).toContain('bg-sky-50');
    expect(cls).toContain('text-sky-700');
  });

  it('should get correct status class for maintenance', () => {
    const cls = component.getStatusClass('maintenance');
    expect(cls).toContain('bg-amber-50');
    expect(cls).toContain('text-amber-700');
  });

  it('should get correct status class for retired', () => {
    const cls = component.getStatusClass('retired');
    expect(cls).toContain('bg-rose-50');
    expect(cls).toContain('text-rose-700');
  });

  it('should get correct status labels', () => {
    expect(component.getStatusLabel('available')).toBe('Disponible');
    expect(component.getStatusLabel('assigned')).toBe('Assigné');
    expect(component.getStatusLabel('maintenance')).toBe('Maintenance');
    expect(component.getStatusLabel('retired')).toBe('Retiré');
  });

  it('should check if value is empty via hasNoValue', () => {
    expect(component.hasNoValue('')).toBe(true);
    expect(component.hasNoValue('   ')).toBe(true);
    expect(component.hasNoValue(null)).toBe(true);
    expect(component.hasNoValue(undefined)).toBe(true);
    expect(component.hasNoValue('test')).toBe(false);
  });

  it('should open add form when user is IT', () => {
    component.isIT.set(true);
    component.openAddForm();

    expect(component.showAddForm()).toBe(true);
    expect(component.editingDeviceId()).toBeNull();
    expect(component.formDevice().name).toBe('');
    expect(component.formDevice().type).toBe('Laptop');
    expect(component.formDevice().status).toBe('available');
  });

  it('should not open add form when user is not IT', () => {
    component.isIT.set(false);
    component.openAddForm();

    expect(component.showAddForm()).toBe(false);
  });

  it('should edit device when user is IT', () => {
    component.isIT.set(true);
    component.editDevice(mockDevice);

    expect(component.showAddForm()).toBe(true);
    expect(component.editingDeviceId()).toBe('1');
    expect(component.formDevice().name).toBe('Laptop 1');
  });

  it('should not edit device when user is not IT', () => {
    component.isIT.set(false);
    component.editDevice(mockDevice);

    expect(component.showAddForm()).toBe(false);
  });

  it('should cancel form', () => {
    component.showAddForm.set(true);
    component.editingDeviceId.set('1');

    component.cancelForm();

    expect(component.showAddForm()).toBe(false);
    expect(component.editingDeviceId()).toBeNull();
  });

  it('should open device action menu', () => {
    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      target: { getBoundingClientRect: () => ({ bottom: 100, left: 50 }) },
    } as any;

    component.toggleDeviceActionMenu('device1', event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.openActionMenuId()).toBe('device1');
    expect(component.actionMenuPosition()).toEqual({ top: 105, left: 50 });
  });

  it('should close device action menu on second click of same device', () => {
    component.openActionMenuId.set('device1');
    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      target: { getBoundingClientRect: () => ({ bottom: 100, left: 50 }) },
    } as any;

    component.toggleDeviceActionMenu('device1', event);

    expect(component.openActionMenuId()).toBeNull();
    expect(component.actionMenuPosition()).toBeNull();
  });

  it('should close action menu via closeActionMenu', () => {
    component.openActionMenuId.set('device1');
    component.actionMenuPosition.set({ top: 100, left: 50 });

    component.closeActionMenu();

    expect(component.openActionMenuId()).toBeNull();
    expect(component.actionMenuPosition()).toBeNull();
  });

  it('should calculate total pages correctly', () => {
    component.total.set(20);
    component.itemsPerPage = 5;
    expect(component.totalPages).toBe(4);
  });

  it('should return minimum 1 for totalPages when total is 0', () => {
    component.total.set(0);
    expect(component.totalPages).toBe(1);
  });

  it('should return correct page numbers', () => {
    component.total.set(10);
    component.itemsPerPage = 5;
    expect(component.pageNumbers()).toEqual([1, 2]);
  });

  it('should go to specific page', () => {
    component.total.set(20);
    component.itemsPerPage = 5;
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 20, page: 2, limit: 5 })
    );

    component.goToPage(2);

    expect(component.currentPage()).toBe(2);
    expect(apiService.getDevices).toHaveBeenCalled();
  });

  it('should not go to page beyond total', () => {
    component.total.set(20);
    component.itemsPerPage = 5;
    const initialPage = component.currentPage();

    component.goToPage(10);

    expect(component.currentPage()).toBe(initialPage);
  });

  it('should not go to page 0', () => {
    component.total.set(20);
    component.itemsPerPage = 5;
    const initialPage = component.currentPage();

    component.goToPage(0);

    expect(component.currentPage()).toBe(initialPage);
  });

  it('should reset current page to 1 on filter change', () => {
    component.currentPage.set(3);
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 4 })
    );

    component.onFilterChange();

    expect(component.currentPage()).toBe(1);
    expect(apiService.getDevices).toHaveBeenCalled();
  });

  it('should open allocation modal when IT', () => {
    component.isIT.set(true);

    component.openAllocate(mockDevice);

    expect(component.selectedDeviceForAllocation()).toEqual(mockDevice);
    expect(component.selectedConsultantId()).toBe('');
  });

  it('should not open allocation modal when not IT', () => {
    component.isIT.set(false);

    component.openAllocate(mockDevice);

    expect(component.selectedDeviceForAllocation()).toBeNull();
  });

  it('should close allocation modal and reset state', () => {
    component.selectedDeviceForAllocation.set(mockDevice as any);
    component.selectedConsultantId.set('c1');
    component.allocateLoading.set(true);

    component.closeAllocate();

    expect(component.selectedDeviceForAllocation()).toBeNull();
    expect(component.selectedConsultantId()).toBe('');
    expect(component.allocateLoading()).toBe(false);
  });

  it('should confirm allocation and call API', () => {
    component.selectedDeviceForAllocation.set(mockDevice as any);
    component.selectedConsultantId.set('consultant123');
    apiService.allocateDevice.and.returnValue(of({}));
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 4 })
    );

    component.confirmAllocate();

    expect(apiService.allocateDevice).toHaveBeenCalledWith('1', 'consultant123');
  });

  it('should not confirm allocation without device', () => {
    component.selectedDeviceForAllocation.set(null);
    component.selectedConsultantId.set('consultant123');

    component.confirmAllocate();

    expect(apiService.allocateDevice).not.toHaveBeenCalled();
  });

  it('should not confirm allocation without consultant', () => {
    component.selectedDeviceForAllocation.set(mockDevice as any);
    component.selectedConsultantId.set('');

    component.confirmAllocate();

    expect(apiService.allocateDevice).not.toHaveBeenCalled();
  });

  it('should delete device when IT', () => {
    component.isIT.set(true);
    apiService.deleteDevice.and.returnValue(of({ message: 'deleted' }));
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 4 })
    );

    component.deleteDevice('device1');

    expect(apiService.deleteDevice).toHaveBeenCalledWith('device1');
  });

  it('should not delete device when not IT', () => {
    component.isIT.set(false);

    component.deleteDevice('device1');

    expect(apiService.deleteDevice).not.toHaveBeenCalled();
  });

  it('should toggle status from available to maintenance', () => {
    component.isIT.set(true);
    component.devices.set([{ ...mockDevice, status: 'available' }]);
    apiService.updateDeviceStatus.and.returnValue(of({}));
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 4 })
    );

    component.toggleStatus('1');

    expect(apiService.updateDeviceStatus).toHaveBeenCalledWith(
      '1',
      'maintenance'
    );
  });

  it('should toggle status from maintenance to available', () => {
    component.isIT.set(true);
    component.devices.set([{ ...mockDevice, status: 'maintenance' }]);
    apiService.updateDeviceStatus.and.returnValue(of({}));
    apiService.getDevices.and.returnValue(
      of({ devices: [], total: 0, page: 1, limit: 4 })
    );

    component.toggleStatus('1');

    expect(apiService.updateDeviceStatus).toHaveBeenCalledWith(
      '1',
      'available'
    );
  });

  it('should not toggle status for assigned device and set error', () => {
    component.isIT.set(true);
    component.devices.set([{ ...mockDevice, status: 'assigned' }]);

    component.toggleStatus('1');

    expect(apiService.updateDeviceStatus).not.toHaveBeenCalled();
    expect(component.error()).toBe(
      'Ce statut ne peut pas être basculé depuis cette action.'
    );
  });

  it('should not toggle status when not IT', () => {
    component.isIT.set(false);
    component.devices.set([{ ...mockDevice }]);

    component.toggleStatus('1');

    expect(apiService.updateDeviceStatus).not.toHaveBeenCalled();
  });

  it('should not toggle status for non-existent device', () => {
    component.isIT.set(true);
    component.devices.set([]);

    component.toggleStatus('nonexistent');

    expect(apiService.updateDeviceStatus).not.toHaveBeenCalled();
  });

  it('should open ticket modal with device id', () => {
    component.openTicketModal(mockDevice);

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
    component.ticketError.set('some error');

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
  });

  it('should read isIT from localStorage on construction', () => {
    localStorage.setItem('user_role', 'IT');
    const comp = TestBed.createComponent(DeviceManagementComponent).componentInstance;
    expect(comp.isIT()).toBe(true);
  });

  it('should be false isIT for non-IT role', () => {
    localStorage.setItem('user_role', 'CONSULTANT');
    const comp = TestBed.createComponent(DeviceManagementComponent).componentInstance;
    expect(comp.isIT()).toBe(false);
  });

  it('should close action menu on escape key', () => {
    component.openActionMenuId.set('device1');
    component.onEscape(new KeyboardEvent('keydown'));
    expect(component.openActionMenuId()).toBeNull();
  });

  it('should close action menu on document click outside menu', () => {
    component.openActionMenuId.set('device1');
    const event = {
      target: { closest: () => null },
    } as any;
    component.onDocumentClick(event);
    expect(component.openActionMenuId()).toBeNull();
  });

  describe('saveDevice', () => {
    it('should not save if device name is empty', async () => {
      component.formDevice.set({ name: '', type: 'Laptop' });
      await component.saveDevice();
      expect(apiService.createDevice).not.toHaveBeenCalled();
      expect(apiService.updateDevice).not.toHaveBeenCalled();
    });

    it('should create new device when editingDeviceId is null', (done) => {
      component.isIT.set(true);
      component.editingDeviceId.set(null);
      component.formDevice.set({
        name: 'New Device', type: 'Laptop', department: 'IT', owner: 'John',
        email: 'john@test.com', status: 'available', location: 'Office',
        serialNumber: 'SN001', purchaseDate: '2024-01-01'
      });
      apiService.createDevice.and.returnValue(of({ _id: 'new1' }));
      apiService.getDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 4 }));

      component.saveDevice().then(() => {
        expect(apiService.createDevice).toHaveBeenCalled();
        done();
      });
    });

    it('should update existing device when editingDeviceId is set', (done) => {
      component.isIT.set(true);
      component.editingDeviceId.set('existing1');
      component.formDevice.set({
        name: 'Updated Device', type: 'Desktop', department: 'HR', owner: 'Jane',
        email: 'jane@test.com', status: 'available', location: 'Office 2',
        serialNumber: 'SN002', purchaseDate: '2024-06-01'
      });
      apiService.updateDevice.and.returnValue(of({ _id: 'existing1' }));
      apiService.getDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 4 }));

      component.saveDevice().then(() => {
        expect(apiService.updateDevice).toHaveBeenCalledWith('existing1', jasmine.any(Object));
        done();
      });
    });

    it('should handle save error', async () => {
      component.formDevice.set({ name: 'Device', type: 'Laptop' });
      apiService.createDevice.and.returnValue(throwError(() => ({ message: 'Save failed' })));

      await component.saveDevice();

      expect(component.error()).toBe('Save failed');
    });
  });

  describe('handleExcelImport', () => {
    it('should return early if no file', async () => {
      const event = { target: { files: null, value: '' } } as any;
      await component.handleExcelImport(event);
      expect(component.importingDevices()).toBe(false);
    });

    it('should import devices successfully', (done) => {
      const file = new File(['data'], 'devices.xlsx');
      const event = { target: { files: [file], value: '' } } as any;
      apiService.importDevices.and.returnValue(of({ success: 5, failed: 0, errors: [] }));
      apiService.getDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 4 }));

      component.handleExcelImport(event).then(() => {
        expect(component.importFeedback()).toContain('5');
        expect(component.importFeedbackType()).toBe('success');
        done();
      });
    });

    it('should handle import errors', (done) => {
      const file = new File(['data'], 'devices.xlsx');
      const event = { target: { files: [file], value: '' } } as any;
      apiService.importDevices.and.returnValue(throwError(() => ({ message: 'Import failed' })));

      component.handleExcelImport(event).then(() => {
        expect(component.importFeedback()).toBe('Import failed');
        expect(component.importFeedbackType()).toBe('error');
        done();
      });
    });

    it('should handle import with errors list', (done) => {
      const file = new File(['data'], 'devices.xlsx');
      const event = { target: { files: [file], value: '' } } as any;
      apiService.importDevices.and.returnValue(of({ success: 3, failed: 2, errors: ['Row 5 invalid', 'Row 8 duplicate'] }));
      apiService.getDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 4 }));

      component.handleExcelImport(event).then(() => {
        expect(component.importFeedback()).toContain('Erreurs');
        expect(component.importFeedbackType()).toBe('success');
        done();
      });
    });
  });

  describe('exportDevices', () => {
    it('should export devices successfully', () => {
      const blob = new Blob(['data']);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      const clickSpy = jasmine.createSpy('click');
      spyOn(document, 'createElement').and.returnValue({ click: clickSpy, href: '', download: '' } as any);

      apiService.exportDevices.and.returnValue(of(blob));

      component.exportDevices();

      expect(apiService.exportDevices).toHaveBeenCalled();
    });

    it('should handle export error', () => {
      apiService.exportDevices.and.returnValue(throwError(() => new Error('fail')));

      component.exportDevices();

      expect(component.error()).toBe("Impossible d'exporter la liste des appareils.");
    });
  });

  describe('openDatePicker', () => {
    it('should focus input when showPicker not available', () => {
      const el = { focus: jasmine.createSpy('focus'), showPicker: undefined } as any;
      component.openDatePicker(el);
      expect(el.focus).toHaveBeenCalled();
    });

    it('should return early for null element', () => {
      component.openDatePicker(null);
    });
  });

  describe('confirmAllocate error', () => {
    it('should handle allocation error', () => {
      component.selectedDeviceForAllocation.set(mockDevice as any);
      component.selectedConsultantId.set('consultant123');
      apiService.allocateDevice.and.returnValue(throwError(() => new Error('fail')));

      component.confirmAllocate();

      expect(component.allocateLoading()).toBe(false);
    });
  });

  describe('deleteDevice error', () => {
    it('should reload devices on delete error', () => {
      component.isIT.set(true);
      apiService.deleteDevice.and.returnValue(throwError(() => new Error('fail')));
      apiService.getDevices.and.returnValue(
        of({ devices: [], total: 0, page: 1, limit: 4 })
      );

      component.deleteDevice('device1');

      expect(apiService.getDevices).toHaveBeenCalled();
    });
  });

  describe('toggleStatus error', () => {
    it('should set error on toggle status failure', () => {
      component.isIT.set(true);
      component.devices.set([{ ...mockDevice, status: 'available' }]);
      apiService.updateDeviceStatus.and.returnValue(throwError(() => new Error('fail')));

      component.toggleStatus('1');

      expect(component.error()).toBe("Impossible de mettre à jour le statut de l'appareil.");
    });
  });
});
