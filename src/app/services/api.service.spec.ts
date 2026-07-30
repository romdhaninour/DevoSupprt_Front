import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    _id: '507f1f77bcf86cd799439011',
    nom: 'Doe',
    prenom: 'John',
    email: 'john.doe@example.com',
    role: 'ADMIN',
    status: 'active',
    isConsultant: false,
    profilePicture: 'https://example.com/pic.jpg',
  };

  const mockArchivedUser: User = {
    _id: '507f1f77bcf86cd799439011',
    nom: 'Doe',
    prenom: 'John',
    email: 'john.doe@example.com',
    role: 'ADMIN',
    status: 'archived',
    isConsultant: false,
    profilePicture: 'https://example.com/pic.jpg',
  };

  const mockInactiveUser: User = {
    _id: '507f1f77bcf86cd799439011',
    nom: 'Doe',
    prenom: 'John',
    email: 'john.doe@example.com',
    role: 'ADMIN',
    status: 'inactive',
    isConsultant: false,
    profilePicture: 'https://example.com/pic.jpg',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuthHeaders', () => {
    it('should include Authorization header when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      const headers = (service as any).getAuthHeaders();
      expect(headers.headers.get('Authorization')).toBe('Bearer test-token');
      localStorage.removeItem('auth_token');
    });

    it('should not include Authorization header when token does not exist', () => {
      localStorage.removeItem('auth_token');
      const headers = (service as any).getAuthHeaders();
      expect(headers.headers.get('Authorization')).toBeNull();
    });
  });

  describe('getUsers', () => {
    it('should return users', () => {
      const mockUsers = [mockUser, { ...mockUser, email: 'jane@example.com' }];
      
      service.getUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne('http://localhost:3000/users');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush(mockUsers);
    });

    it('should include Authorization header when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      service.getUsers().subscribe();

      const req = httpMock.expectOne('http://localhost:3000/users');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      localStorage.removeItem('auth_token');
    });
  });

  describe('getArchivedUsers', () => {
    it('should return archived users', () => {
      const mockArchivedUsers = [mockArchivedUser];
      
      service.getArchivedUsers().subscribe(users => {
        expect(users).toEqual(mockArchivedUsers);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/archived');
      expect(req.request.method).toBe('GET');
      req.flush(mockArchivedUsers);
    });
  });

  describe('createUser', () => {
    it('should create a user', () => {
      const newUser = { nom: 'Smith', prenom: 'Jane', email: 'jane@example.com', role: 'ADMIN' as const };
      
      service.createUser(newUser).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush(mockUser);
    });

    it('should include Authorization header when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      const newUser = { nom: 'Smith', prenom: 'Jane', email: 'jane@example.com', role: 'ADMIN' as const };
      
      service.createUser(newUser).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/users');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      localStorage.removeItem('auth_token');
    });
  });

  describe('updateUser', () => {
    it('should update a user', () => {
      const updateData = { nom: 'Smith' };
      const updatedUser = { ...mockUser, nom: 'Smith' };
      
      service.updateUser('507f1f77bcf86cd799439011', updateData).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedUser);
    });

    it('should include Authorization header when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      service.updateUser('507f1f77bcf86cd799439011', {}).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      localStorage.removeItem('auth_token');
    });
  });

  describe('activateUser', () => {
    it('should activate a user', () => {
      const activatedUser = mockUser;
      
      service.activateUser('507f1f77bcf86cd799439011').subscribe(user => {
        expect(user).toEqual(activatedUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011/activate');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush(activatedUser);
    });

    it('should include Authorization header when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      service.activateUser('507f1f77bcf86cd799439011').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011/activate');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      localStorage.removeItem('auth_token');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', () => {
      const deactivatedUser = mockInactiveUser;
      
      service.deactivateUser('507f1f77bcf86cd799439011').subscribe(user => {
        expect(user).toEqual(deactivatedUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011/deactivate');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush(deactivatedUser);
    });
  });

  describe('archiveUser', () => {
    it('should archive a user', () => {
      const archivedUser = mockArchivedUser;
      
      service.archiveUser('507f1f77bcf86cd799439011').subscribe(user => {
        expect(user).toEqual(archivedUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011/archive');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush(archivedUser);
    });
  });

  describe('restoreUser', () => {
    it('should restore a user', () => {
      const restoredUser = mockInactiveUser;
      
      service.restoreUser('507f1f77bcf86cd799439011').subscribe(user => {
        expect(user).toEqual(restoredUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011/restore');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush(restoredUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', () => {
      const deleteResponse = { message: 'User john.doe@example.com deleted successfully' };
      
      service.deleteUser('507f1f77bcf86cd799439011').subscribe(response => {
        expect(response).toEqual(deleteResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011');
      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });

    it('should include Authorization header when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      service.deleteUser('507f1f77bcf86cd799439011').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      localStorage.removeItem('auth_token');
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const healthResponse = { status: 'ok' };
      
      service.getHealth().subscribe(response => {
        expect(response).toEqual(healthResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/health');
      expect(req.request.method).toBe('GET');
      req.flush(healthResponse);
    });

    it('should not include Authorization header for health check', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      service.getHealth().subscribe();

      const req = httpMock.expectOne('http://localhost:3000/health');
      expect(req.request.headers.get('Authorization')).toBeNull();
      localStorage.removeItem('auth_token');
    });
  });

  describe('Ticket API methods', () => {
    const mockTicket = {
      _id: '507f1f77bcf86cd799439012',
      title: 'Test Ticket',
      description: 'Test description',
      status: 'OPEN',
      priority: 'MEDIUM',
      issueType: 'HARDWARE',
      createdAt: new Date(),
    };

    describe('createTicket', () => {
      it('should create a ticket', () => {
        const newTicketData = { title: 'New Ticket', description: 'Test', issueType: 'HARDWARE', priority: 'MEDIUM' };
        
        service.createTicket(newTicketData).subscribe(ticket => {
          expect(ticket).toEqual(mockTicket);
        });

        const req = httpMock.expectOne('http://localhost:3000/tickets');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newTicketData);
        req.flush(mockTicket);
      });

      it('should include Authorization header when token exists', () => {
        localStorage.setItem('auth_token', 'test-token');
        
        service.createTicket({}).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets');
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
        localStorage.removeItem('auth_token');
      });
    });

    describe('getTickets', () => {
      it('should return tickets', () => {
        const mockTicketsResponse = { tickets: [mockTicket], total: 1 };
        
        service.getTickets().subscribe(response => {
          expect(response).toEqual(mockTicketsResponse);
        });

        const req = httpMock.expectOne('http://localhost:3000/tickets');
        expect(req.request.method).toBe('GET');
        req.flush(mockTicketsResponse);
      });

      it('should include status filter in query params', () => {
        service.getTickets('OPEN').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets?status=OPEN');
        expect(req.request.method).toBe('GET');
        req.flush({ tickets: [], total: 0 });
      });

      it('should include multiple filters in query params', () => {
        service.getTickets('OPEN', 'HIGH', 'HARDWARE').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets?status=OPEN&priority=HIGH&issueType=HARDWARE');
        expect(req.request.method).toBe('GET');
        req.flush({ tickets: [], total: 0 });
      });
    });

    describe('getTicket', () => {
      it('should return a single ticket', () => {
        service.getTicket('507f1f77bcf86cd799439012').subscribe(ticket => {
          expect(ticket).toEqual(mockTicket);
        });

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012');
        expect(req.request.method).toBe('GET');
        req.flush(mockTicket);
      });

      it('should include Authorization header when token exists', () => {
        localStorage.setItem('auth_token', 'test-token');
        
        service.getTicket('507f1f77bcf86cd799439012').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012');
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
        localStorage.removeItem('auth_token');
      });
    });

    describe('updateTicketStatus', () => {
      it('should update ticket status', () => {
        const updateData = { status: 'IN_PROGRESS' };
        const updatedTicket = { ...mockTicket, status: 'IN_PROGRESS' };
        
        service.updateTicketStatus('507f1f77bcf86cd799439012', updateData).subscribe(ticket => {
          expect(ticket).toEqual(updatedTicket);
        });

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012/status');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(updateData);
        req.flush(updatedTicket);
      });

      it('should include resolution in update data', () => {
        const updateData = { status: 'RESOLVED', resolution: 'REPAIR' };
        
        service.updateTicketStatus('507f1f77bcf86cd799439012', updateData).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012/status');
        expect(req.request.body).toEqual(updateData);
        req.flush(mockTicket);
      });
    });

    describe('assignTicket', () => {
      it('should assign a ticket', () => {
        const assignData = { assignedTo: '507f1f77bcf86cd799439011' };
        const assignedTicket = { ...mockTicket, assignedTo: mockUser };
        
        service.assignTicket('507f1f77bcf86cd799439012', assignData).subscribe(ticket => {
          expect(ticket).toEqual(assignedTicket);
        });

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012/assign');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(assignData);
        req.flush(assignedTicket);
      });
    });

    describe('addTicketComment', () => {
      it('should add a comment to a ticket', () => {
        const commentData = { text: 'Test comment' };
        const ticketWithComment = {
          ...mockTicket,
          comments: [{ author: mockUser, text: 'Test comment', createdAt: new Date() }]
        };
        
        service.addTicketComment('507f1f77bcf86cd799439012', commentData).subscribe(ticket => {
          expect(ticket).toEqual(ticketWithComment);
        });

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012/comments');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(commentData);
        req.flush(ticketWithComment);
      });
    });

    describe('deleteTicket', () => {
      it('should delete a ticket', () => {
        const deleteResponse = { message: 'Ticket deleted successfully' };
        
        service.deleteTicket('507f1f77bcf86cd799439012').subscribe(response => {
          expect(response).toEqual(deleteResponse);
        });

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012');
        expect(req.request.method).toBe('DELETE');
        req.flush(deleteResponse);
      });

      it('should include Authorization header when token exists', () => {
        localStorage.setItem('auth_token', 'test-token');
        
        service.deleteTicket('507f1f77bcf86cd799439012').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets/507f1f77bcf86cd799439012');
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
        localStorage.removeItem('auth_token');
      });
    });
  });

  describe('Device API methods', () => {
    const mockDevice = {
      _id: '507f1f77bcf86cd799439013',
      name: 'Test Device',
      type: 'LAPTOP',
      status: 'available',
      serialNumber: 'SN123456',
    };

    describe('getDevices', () => {
      it('should return devices', () => {
        const mockDevicesResponse = { devices: [mockDevice], total: 1, page: 1, limit: 10 };
        
        service.getDevices().subscribe(response => {
          expect(response).toEqual(mockDevicesResponse);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices');
        expect(req.request.method).toBe('GET');
        req.flush(mockDevicesResponse);
      });

      it('should include pagination params', () => {
        service.getDevices(1, 20).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/devices?page=1&limit=20');
        expect(req.request.method).toBe('GET');
        req.flush({ devices: [], total: 0, page: 1, limit: 20 });
      });

      it('should include search and status filters', () => {
        service.getDevices(1, 10, 'test', 'available', 'LAPTOP').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/devices?page=1&limit=10&search=test&status=available&type=LAPTOP');
        expect(req.request.method).toBe('GET');
        req.flush({ devices: [], total: 0, page: 1, limit: 10 });
      });
    });

    describe('createDevice', () => {
      it('should create a device', () => {
        const newDeviceData = { name: 'New Device', type: 'LAPTOP', serialNumber: 'SN789' };
        
        service.createDevice(newDeviceData).subscribe(device => {
          expect(device).toEqual(mockDevice);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newDeviceData);
        req.flush(mockDevice);
      });
    });

    describe('updateDevice', () => {
      it('should update a device', () => {
        const updateData = { name: 'Updated Device' };
        const updatedDevice = { ...mockDevice, name: 'Updated Device' };
        
        service.updateDevice('507f1f77bcf86cd799439013', updateData).subscribe(device => {
          expect(device).toEqual(updatedDevice);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices/507f1f77bcf86cd799439013');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(updateData);
        req.flush(updatedDevice);
      });
    });

    describe('deleteDevice', () => {
      it('should delete a device', () => {
        const deleteResponse = { message: 'Device deleted successfully' };
        
        service.deleteDevice('507f1f77bcf86cd799439013').subscribe(response => {
          expect(response).toEqual(deleteResponse);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices/507f1f77bcf86cd799439013');
        expect(req.request.method).toBe('DELETE');
        req.flush(deleteResponse);
      });
    });

    describe('allocateDevice', () => {
      it('should allocate a device to a consultant', () => {
        const allocateData = { consultantId: '507f1f77bcf86cd799439011' };
        const allocatedDevice = { ...mockDevice, assignedTo: mockUser };
        
        service.allocateDevice('507f1f77bcf86cd799439013', allocateData.consultantId).subscribe(device => {
          expect(device).toEqual(allocatedDevice);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices/507f1f77bcf86cd799439013/allocate');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(allocateData);
        req.flush(allocatedDevice);
      });
    });

    describe('returnDevice', () => {
      it('should return a device', () => {
        const returnedDevice = { ...mockDevice, assignedTo: null };
        
        service.returnDevice('507f1f77bcf86cd799439013').subscribe(device => {
          expect(device).toEqual(returnedDevice);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices/507f1f77bcf86cd799439013/return');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({});
        req.flush(returnedDevice);
      });
    });

    describe('getAssignedDevices', () => {
      it('should return assigned devices', () => {
        const response = { devices: [mockDevice], total: 1, page: 1, limit: 10 };

        service.getAssignedDevices().subscribe(res => {
          expect(res).toEqual(response);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices/assigned');
        expect(req.request.method).toBe('GET');
        req.flush(response);
      });

      it('should include pagination and search params', () => {
        service.getAssignedDevices(1, 10, 'test', 'user1').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/devices/assigned?page=1&limit=10&search=test&userId=user1');
        expect(req.request.method).toBe('GET');
        req.flush({ devices: [], total: 0, page: 1, limit: 10 });
      });
    });

    describe('updateDeviceStatus', () => {
      it('should update device status', () => {
        service.updateDeviceStatus('d1', 'maintenance').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/devices/d1/status');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ status: 'maintenance' });
        req.flush({});
      });
    });

    describe('getConsultants', () => {
      it('should return consultants', () => {
        service.getConsultants().subscribe(users => {
          expect(users).toEqual([mockUser]);
        });

        const req = httpMock.expectOne('http://localhost:3000/users/consultants');
        expect(req.request.method).toBe('GET');
        req.flush([mockUser]);
      });
    });

    describe('getDashboardStats', () => {
      it('should return dashboard stats', () => {
        const stats = { totalTickets: 10, totalDevices: 5 };
        service.getDashboardStats().subscribe(res => {
          expect(res).toEqual(stats);
        });

        const req = httpMock.expectOne('http://localhost:3000/dashboard/stats');
        expect(req.request.method).toBe('GET');
        req.flush(stats);
      });

      it('should include Authorization header', () => {
        localStorage.setItem('auth_token', 'test-token');
        service.getDashboardStats().subscribe();

        const req = httpMock.expectOne('http://localhost:3000/dashboard/stats');
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
        localStorage.removeItem('auth_token');
      });
    });

    describe('getCurrentUser', () => {
      it('should return current user', () => {
        service.getCurrentUser().subscribe(user => {
          expect(user).toEqual(mockUser);
        });

        const req = httpMock.expectOne('http://localhost:3000/users/me/profile');
        expect(req.request.method).toBe('GET');
        req.flush(mockUser);
      });
    });

    describe('getUserById', () => {
      it('should return user by id', () => {
        service.getUserById('507f1f77bcf86cd799439011').subscribe(user => {
          expect(user).toEqual(mockUser);
        });

        const req = httpMock.expectOne('http://localhost:3000/users/507f1f77bcf86cd799439011');
        expect(req.request.method).toBe('GET');
        req.flush(mockUser);
      });
    });

    describe('importUsers', () => {
      it('should import users from file', () => {
        const file = new File(['data'], 'users.xlsx', { type: 'application/octet-stream' });
        const importResult = { success: 5, failed: 1, errors: ['Invalid row'] };

        service.importUsers(file).subscribe(result => {
          expect(result).toEqual(importResult);
        });

        const req = httpMock.expectOne('http://localhost:3000/users/import');
        expect(req.request.method).toBe('POST');
        req.flush(importResult);
      });
    });

    describe('exportUsers', () => {
      it('should export users', () => {
        const blob = new Blob(['data']);
        service.exportUsers().subscribe(result => {
          expect(result).toBe(blob);
        });

        const req = httpMock.expectOne('http://localhost:3000/users/export');
        expect(req.request.method).toBe('POST');
        req.flush(blob);
      });

      it('should include search in body', () => {
        service.exportUsers('test').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/users/export');
        expect(req.request.body).toEqual({ search: 'test' });
        req.flush(new Blob());
      });
    });

    describe('importDevices', () => {
      it('should import devices from file', () => {
        const file = new File(['data'], 'devices.xlsx', { type: 'application/octet-stream' });
        const importResult = { success: 3, failed: 0, errors: [] };

        service.importDevices(file).subscribe(result => {
          expect(result).toEqual(importResult);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices/import');
        expect(req.request.method).toBe('POST');
        req.flush(importResult);
      });
    });

    describe('exportDevices', () => {
      it('should export devices', () => {
        const blob = new Blob(['data']);
        service.exportDevices().subscribe(result => {
          expect(result).toBe(blob);
        });

        const req = httpMock.expectOne('http://localhost:3000/devices/export');
        expect(req.request.method).toBe('POST');
        req.flush(blob);
      });

      it('should include search in body', () => {
        service.exportDevices('laptop').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/devices/export');
        expect(req.request.body).toEqual({ search: 'laptop' });
        req.flush(new Blob());
      });
    });

    describe('getDevices with status all', () => {
      it('should not include status param when status is all', () => {
        service.getDevices(1, 10, '', 'all', 'all').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/devices?page=1&limit=10');
        expect(req.request.method).toBe('GET');
        req.flush({ devices: [], total: 0, page: 1, limit: 10 });
      });
    });

    describe('getDevices with only status filter', () => {
      it('should include status but not type when type is all', () => {
        service.getDevices(1, 10, '', 'available', 'all').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/devices?page=1&limit=10&status=available');
        expect(req.request.method).toBe('GET');
        req.flush({ devices: [], total: 0, page: 1, limit: 10 });
      });
    });

    describe('getTickets with mine filter', () => {
      it('should include mine=true when mine is true', () => {
        service.getTickets(undefined, undefined, undefined, undefined, undefined, true).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets?mine=true');
        expect(req.request.method).toBe('GET');
        req.flush({ tickets: [], total: 0 });
      });

      it('should include date filters', () => {
        service.getTickets(undefined, undefined, undefined, '2024-01-01', '2024-12-31').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/tickets?startDate=2024-01-01&endDate=2024-12-31');
        expect(req.request.method).toBe('GET');
        req.flush({ tickets: [], total: 0 });
      });
    });
  });
});
