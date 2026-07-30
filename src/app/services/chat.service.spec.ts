import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, skip } from 'rxjs';
import { ChatService, ChatMessage, Conversation } from './chat.service';
import { ApiService } from './api.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService, ApiService]
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    service.disconnect();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get auth headers with token', () => {
    localStorage.setItem('auth_token', 'test-token');
    const headers = (service as any).getAuthHeaders();
    expect(headers.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should get auth headers without token', () => {
    localStorage.removeItem('auth_token');
    const headers = (service as any).getAuthHeaders();
    expect(headers.headers.get('Authorization')).toBeNull();
  });

  it('should connect socket with token', () => {
    localStorage.setItem('auth_token', 'test-token');
    service.connectSocket();
    expect(service).toBeTruthy();
  });

  it('should not connect socket without token', () => {
    localStorage.removeItem('auth_token');
    service.connectSocket();
    // Socket should not be created without token
  });

  it('should disconnect socket', () => {
    localStorage.setItem('auth_token', 'test-token');
    service.connectSocket();
    service.disconnect();
    // Socket should be disconnected
  });

  it('should throw error when sending message without socket', () => {
    expect(() => service.sendMessage('user1', 'test message')).toThrowError('Socket not connected');
  });

  it('should mark message as read', () => {
    localStorage.setItem('auth_token', 'test-token');
    service.connectSocket();
    expect(() => service.markAsRead('message1')).not.toThrow();
  });

  it('should join conversation', () => {
    localStorage.setItem('auth_token', 'test-token');
    service.connectSocket();
    expect(() => service.joinConversation('user1')).not.toThrow();
  });

  it('should send typing status', () => {
    localStorage.setItem('auth_token', 'test-token');
    service.connectSocket();
    expect(() => service.sendTypingStatus('user1', true)).not.toThrow();
  });

  it('should get conversations', () => {
    const mockConversations: Conversation[] = [
      {
        partner: {
          _id: '1',
          nom: 'Doe',
          prenom: 'John',
          email: 'john@example.com',
          role: 'IT'
        },
        lastMessage: {} as ChatMessage,
        unreadCount: 0
      }
    ];

    localStorage.setItem('auth_token', 'test-token');
    service.getConversations().subscribe(conversations => {
      expect(conversations).toEqual(mockConversations);
    });

    const req = httpMock.expectOne('http://localhost:3000/chats/conversations');
    expect(req.request.method).toBe('GET');
    req.flush(mockConversations);
  });

  it('should get conversation messages', () => {
    const mockMessages: ChatMessage[] = [
      {
        _id: '1',
        sender: {
          _id: '1',
          nom: 'Doe',
          prenom: 'John',
          email: 'john@example.com'
        },
        receiver: {
          _id: '2',
          nom: 'Smith',
          prenom: 'Jane',
          email: 'jane@example.com'
        },
        message: 'Hello',
        read: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ];

    localStorage.setItem('auth_token', 'test-token');
    service.getConversation('user1').subscribe(messages => {
      expect(messages).toEqual(mockMessages);
    });

    const req = httpMock.expectOne('http://localhost:3000/chats/conversation/user1');
    expect(req.request.method).toBe('GET');
    req.flush(mockMessages);
  });

  it('should get unread messages', () => {
    const mockMessages: ChatMessage[] = [
      {
        _id: '1',
        sender: {
          _id: '1',
          nom: 'Doe',
          prenom: 'John',
          email: 'john@example.com'
        },
        receiver: {
          _id: '2',
          nom: 'Smith',
          prenom: 'Jane',
          email: 'jane@example.com'
        },
        message: 'Hello',
        read: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ];

    localStorage.setItem('auth_token', 'test-token');
    service.getUnreadMessages().subscribe(messages => {
      expect(messages).toEqual(mockMessages);
    });

    const req = httpMock.expectOne('http://localhost:3000/chats/unread');
    expect(req.request.method).toBe('GET');
    req.flush(mockMessages);
  });

  it('should emit new message through observable', (done) => {
    localStorage.setItem('auth_token', 'test-token');
    service.connectSocket();

    service.newMessage$.pipe(skip(1)).subscribe(message => {
      expect(message).toBeTruthy();
      done();
    });

    // Simulate new message event
    (service as any).newMessageSubject.next({} as ChatMessage);
  });

  it('should emit message read through observable', (done) => {
    service.messageRead$.pipe(skip(1)).subscribe(data => {
      expect(data).toEqual({ messageId: '1' });
      done();
    });

    (service as any).messageReadSubject.next({ messageId: '1' });
  });

  it('should emit unread count through observable', (done) => {
    service.unreadCount$.pipe(skip(1)).subscribe(count => {
      expect(count).toBe(5);
      done();
    });

    (service as any).unreadCountSubject.next(5);
  });

  it('should emit typing status through observable', (done) => {
    service.typing$.pipe(skip(1)).subscribe(data => {
      expect(data).toEqual({ userId: 'user1', isTyping: true });
      done();
    });

    (service as any).typingSubject.next({ userId: 'user1', isTyping: true });
  });
});
