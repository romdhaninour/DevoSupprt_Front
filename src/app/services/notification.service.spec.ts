import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService, Notification } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load notifications from API', () => {
    const mockNotifications: Notification[] = [
      {
        _id: '1',
        message: 'Test message',
        timestamp: new Date(),
        read: false,
        type: 'device_allocated',
        userEmail: 'test@test.com',
        recipientRoles: ['ADMIN', 'IT'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    service.loadNotifications();

    const req = httpMock.expectOne('http://localhost:3000/notifications');
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);

    expect(service.notifications().length).toBe(1);
    expect(service.unreadCount()).toBe(1);
  });

  it('should mark notification as read via API', () => {
    const mockNotifications: Notification[] = [
      {
        _id: '1',
        message: 'Test',
        timestamp: new Date(),
        read: false,
        type: 'other',
        userEmail: 'test@test.com',
        recipientRoles: ['ADMIN'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    service.loadNotifications();
    const loadReq = httpMock.expectOne('http://localhost:3000/notifications');
    loadReq.flush(mockNotifications);

    service.markAsRead('1');

    const req = httpMock.expectOne('http://localhost:3000/notifications/1/read');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: '1', read: true });

    expect(service.unreadCount()).toBe(0);
  });

  it('should mark all as read via API', () => {
    service.markAllAsRead();

    const req = httpMock.expectOne('http://localhost:3000/notifications/read-all');
    expect(req.request.method).toBe('PATCH');
    req.flush({ modifiedCount: 2 });
  });

  it('should clear notifications locally', () => {
    service.clearNotifications();
    expect(service.notifications().length).toBe(0);
    expect(service.unreadCount()).toBe(0);
  });
});
