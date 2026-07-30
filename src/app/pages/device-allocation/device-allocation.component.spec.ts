import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeviceAllocationComponent } from './device-allocation.component';
import { ApiService } from '../../services/api.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DeviceAllocationComponent', () => {
  let component: DeviceAllocationComponent;
  let fixture: ComponentFixture<DeviceAllocationComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDevicesResponse = {
    devices: [
      { _id: 'd1', name: 'Laptop 1', status: 'available', type: 'Laptop' },
      { _id: 'd2', name: 'Desktop 1', status: 'assigned', type: 'Desktop', assignedTo: 'u1' },
      { _id: 'd3', name: 'Laptop 2', status: 'available', type: 'Laptop' },
      { _id: 'd4', name: 'Monitor 1', status: 'assigned', type: 'Monitor', assignedTo: 'u2', assignedAt: '2024-01-01' },
    ],
    total: 4,
    page: 1,
    limit: 100,
  };

  const mockConsultants = [
    { _id: 'u1', nom: 'Doe', prenom: 'John', email: 'john@test.com', role: 'CONSULTANT', status: 'active' },
    { _id: 'u2', nom: 'Smith', prenom: 'Jane', email: 'jane@test.com', role: 'CONSULTANT', status: 'active' },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getDevices', 'getConsultants', 'allocateDevice', 'returnDevice'
    ]);

    await TestBed.configureTestingModule({
      imports: [DeviceAllocationComponent],
      providers: [{ provide: ApiService, useValue: spy }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceAllocationComponent);
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
    it('should call loadData on init', () => {
      apiServiceSpy.getDevices.and.returnValue(of(mockDevicesResponse));
      apiServiceSpy.getConsultants.and.returnValue(of(mockConsultants as any));

      component.ngOnInit();

      expect(apiServiceSpy.getDevices).toHaveBeenCalled();
      expect(apiServiceSpy.getConsultants).toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    it('should load devices and split into available and assigned', () => {
      apiServiceSpy.getDevices.and.returnValue(of(mockDevicesResponse));
      apiServiceSpy.getConsultants.and.returnValue(of(mockConsultants as any));

      component.ngOnInit();

      expect(component.devices().length).toBe(2);
      expect(component.assignedDevices().length).toBe(2);
      expect(component.loading()).toBe(false);
    });

    it('should load consultants', () => {
      apiServiceSpy.getDevices.and.returnValue(of({ ...mockDevicesResponse, devices: [] }));
      apiServiceSpy.getConsultants.and.returnValue(of(mockConsultants as any));

      component.ngOnInit();

      expect(component.consultants().length).toBe(2);
    });

    it('should handle device load error', () => {
      apiServiceSpy.getDevices.and.returnValue(throwError(() => new Error('fail')));
      apiServiceSpy.getConsultants.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.loading()).toBe(false);
      expect(component.message()).toBe('Impossible de charger la liste des appareils.');
      expect(component.messageType()).toBe('error');
    });

    it('should handle consultant load error', () => {
      apiServiceSpy.getDevices.and.returnValue(of({ ...mockDevicesResponse, devices: [] }));
      apiServiceSpy.getConsultants.and.returnValue(throwError(() => new Error('fail')));

      component.ngOnInit();

      expect(component.consultants()).toEqual([]);
    });
  });

  describe('assignDevice', () => {
    it('should show error when no device selected', () => {
      component.selectedDeviceId.set('');
      component.selectedConsultantId.set('u1');

      component.assignDevice();

      expect(component.message()).toBe('Sélectionnez un appareil et un consultant.');
      expect(component.messageType()).toBe('error');
      expect(apiServiceSpy.allocateDevice).not.toHaveBeenCalled();
    });

    it('should show error when no consultant selected', () => {
      component.selectedDeviceId.set('d1');
      component.selectedConsultantId.set('');

      component.assignDevice();

      expect(component.message()).toBe('Sélectionnez un appareil et un consultant.');
      expect(component.messageType()).toBe('error');
    });

    it('should allocate device successfully', () => {
      apiServiceSpy.allocateDevice.and.returnValue(of({}));
      apiServiceSpy.getDevices.and.returnValue(of({ ...mockDevicesResponse, devices: [] }));
      apiServiceSpy.getConsultants.and.returnValue(of([]));
      component.selectedDeviceId.set('d1');
      component.selectedConsultantId.set('u1');

      component.assignDevice();

      expect(apiServiceSpy.allocateDevice).toHaveBeenCalledWith('d1', 'u1');
      expect(component.selectedDeviceId()).toBe('');
      expect(component.selectedConsultantId()).toBe('');
    });

    it('should handle allocation error', () => {
      apiServiceSpy.allocateDevice.and.returnValue(throwError(() => new Error('fail')));
      component.selectedDeviceId.set('d1');
      component.selectedConsultantId.set('u1');

      component.assignDevice();

      expect(component.loading()).toBe(false);
      expect(component.message()).toBe("Impossible d'attribuer cet appareil.");
      expect(component.messageType()).toBe('error');
    });
  });

  describe('returnDevice', () => {
    it('should return device successfully', () => {
      apiServiceSpy.returnDevice.and.returnValue(of({}));
      apiServiceSpy.getDevices.and.returnValue(of({ ...mockDevicesResponse, devices: [] }));
      apiServiceSpy.getConsultants.and.returnValue(of([]));

      component.returnDevice('d2');

      expect(apiServiceSpy.returnDevice).toHaveBeenCalledWith('d2');
    });

    it('should show success message after returning device', () => {
      apiServiceSpy.returnDevice.and.returnValue(of({}));
      apiServiceSpy.getDevices.and.returnValue(of({ ...mockDevicesResponse, devices: [] }));
      apiServiceSpy.getConsultants.and.returnValue(of([]));

      component.returnDevice('d2');

      expect(component.message()).toBe('Appareil restitué avec succès.');
      expect(component.messageType()).toBe('success');
    });

    it('should handle return error', () => {
      apiServiceSpy.returnDevice.and.returnValue(throwError(() => new Error('fail')));

      component.returnDevice('d2');

      expect(component.loading()).toBe(false);
      expect(component.message()).toBe("Impossible de restituer cet appareil.");
      expect(component.messageType()).toBe('error');
    });
  });

  describe('setMessage', () => {
    it('should set message and type', () => {
      (component as any).setMessage('Test message', 'success');
      expect(component.message()).toBe('Test message');
      expect(component.messageType()).toBe('success');
    });
  });
});
