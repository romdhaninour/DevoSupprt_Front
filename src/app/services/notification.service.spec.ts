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
    
    // Flush requests from constructor
    const req = httpMock.expectOne('http://localhost:3000/notifications');
    req.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reload notifications from API', () => {
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
    // Load some notifications first
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

  it('should refresh notifications', () => {
    service.refreshNotifications();
    const req = httpMock.expectOne('http://localhost:3000/notifications');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should handle load notifications error', () => {
    service.loadNotifications();
    const req = httpMock.expectOne('http://localhost:3000/notifications');
    req.error(new ErrorEvent('error'));
    expect(service.loading()).toBe(false);
  });

  it('should handle mark as read error', () => {
    service.markAsRead('1');
    const req = httpMock.expectOne('http://localhost:3000/notifications/1/read');
    req.error(new ErrorEvent('error'));
  });

  it('should handle mark all as read error', () => {
    service.markAllAsRead();
    const req = httpMock.expectOne('http://localhost:3000/notifications/read-all');
    req.error(new ErrorEvent('error'));
  });

  it('should compute unread count', () => {
    const mockNotifications = [
      { _id: '1', message: 'a', read: false, timestamp: new Date(), type: 't', userEmail: 'a@b.com', recipientRoles: ['ADMIN'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { _id: '2', message: 'b', read: true, timestamp: new Date(), type: 't', userEmail: 'a@b.com', recipientRoles: ['ADMIN'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    service.loadNotifications();
    const req = httpMock.expectOne('http://localhost:3000/notifications');
    req.flush(mockNotifications);

    expect(service.unreadCount()).toBe(1);
    expect(service.hasUnread()).toBe(true);
  });

  it('should have hasUnread false when all read', () => {
    const mockNotifications = [
      { _id: '1', message: 'a', read: true, timestamp: new Date(), type: 't', userEmail: 'a@b.com', recipientRoles: ['ADMIN'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    service.loadNotifications();
    const req = httpMock.expectOne('http://localhost:3000/notifications');
    req.flush(mockNotifications);

    expect(service.unreadCount()).toBe(0);
    expect(service.hasUnread()).toBe(false);
  });

  it('should disconnect socket', () => {
    service.disconnectSocket();
    expect(service).toBeTruthy();
  });

  it('should load notifications without auth token', () => {
    localStorage.removeItem('auth_token');
    service.loadNotifications();
    const req = httpMock.expectOne('http://localhost:3000/notifications');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush([]);
  });
});
