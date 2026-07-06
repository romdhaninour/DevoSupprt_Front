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
});
