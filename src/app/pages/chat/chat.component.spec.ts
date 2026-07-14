import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ChatComponent } from './chat.component';
import { ChatService, ChatMessage, Conversation } from '../../services/chat.service';
import { User } from '../../models/user.model';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatServiceSpy: jasmine.SpyObj<ChatService>;

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

  const mockMessage: ChatMessage = {
    _id: '507f1f77bcf86cd799439012',
    sender: {
      _id: '507f1f77bcf86cd799439011',
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
    },
    receiver: {
      _id: '507f1f77bcf86cd799439013',
      nom: 'Smith',
      prenom: 'Jane',
      email: 'jane.smith@example.com',
    },
    message: 'Hello',
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockConversation: Conversation = {
    partner: {
      _id: '507f1f77bcf86cd799439013',
      nom: 'Smith',
      prenom: 'Jane',
      email: 'jane.smith@example.com',
      role: 'CONSULTANT',
    },
    lastMessage: mockMessage,
    unreadCount: 2,
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ChatService', [
      'connectSocket',
      'disconnect',
      'sendMessage',
      'markAsRead',
      'joinConversation',
      'sendTypingStatus',
      'getConversations',
      'getConversation',
      'getUnreadMessages',
    ], {
      newMessage$: of(null),
      messageRead$: of(null),
      unreadCount$: of(0),
      typing$: of(null),
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ChatComponent],
      providers: [
        { provide: ChatService, useValue: spy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatServiceSpy = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current user and connect socket', () => {
      chatServiceSpy.getConversations.and.returnValue(of([mockConversation]));
      
      component.ngOnInit();
      
      expect(component.currentUser()).toEqual(mockUser);
      expect(chatServiceSpy.connectSocket).toHaveBeenCalled();
      expect(chatServiceSpy.getConversations).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should disconnect socket and clear subscriptions', () => {
      component.ngOnInit();
      component.ngOnDestroy();
      
      expect(chatServiceSpy.disconnect).toHaveBeenCalled();
    });
  });

  describe('loadConversations', () => {
    it('should load conversations successfully', async () => {
      chatServiceSpy.getConversations.and.returnValue(of([mockConversation]));
      
      await component.loadConversations();
      
      expect(component.conversations()).toEqual([mockConversation]);
      expect(component.loading()).toBe(false);
    });

    it('should handle errors when loading conversations', async () => {
      chatServiceSpy.getConversations.and.returnValue(throwError(() => new Error('Error')));
      
      await component.loadConversations();
      
      expect(component.error()).toBe('Failed to load conversations');
      expect(component.loading()).toBe(false);
    });
  });

  describe('selectConversation', () => {
    it('should select conversation and load messages', async () => {
      chatServiceSpy.getConversation.and.returnValue(of([mockMessage]));
      
      await component.selectConversation(mockConversation);
      
      expect(component.selectedConversation()).toEqual(mockConversation);
      expect(component.messages()).toEqual([mockMessage]);
      expect(chatServiceSpy.joinConversation).toHaveBeenCalledWith(mockConversation.partner._id);
      expect(component.loading()).toBe(false);
    });

    it('should update unread count to 0 after selecting', async () => {
      chatServiceSpy.getConversation.and.returnValue(of([mockMessage]));
      component.conversations.set([mockConversation]);
      
      await component.selectConversation(mockConversation);
      
      expect(component.conversations()[0].unreadCount).toBe(0);
    });

    it('should handle errors when loading messages', async () => {
      chatServiceSpy.getConversation.and.returnValue(throwError(() => new Error('Error')));
      
      await component.selectConversation(mockConversation);
      
      expect(component.error()).toBe('Failed to load messages');
      expect(component.loading()).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', () => {
      component.selectedConversation.set(mockConversation);
      component.newMessage.set('Hello');
      chatServiceSpy.sendMessage.and.returnValue(of(mockMessage));
      
      component.sendMessage();
      
      expect(chatServiceSpy.sendMessage).toHaveBeenCalledWith(
        mockConversation.partner._id,
        'Hello'
      );
      expect(component.messages()).toContain(mockMessage);
      expect(component.newMessage()).toBe('');
    });

    it('should not send empty message', () => {
      component.selectedConversation.set(mockConversation);
      component.newMessage.set('');
      
      component.sendMessage();
      
      expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send if no conversation selected', () => {
      component.newMessage.set('Hello');
      
      component.sendMessage();
      
      expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle errors when sending message', () => {
      component.selectedConversation.set(mockConversation);
      component.newMessage.set('Hello');
      chatServiceSpy.sendMessage.and.returnValue(throwError(() => new Error('Error')));
      
      component.sendMessage();
      
      expect(component.error()).toBe('Failed to send message');
    });
  });

  describe('onTyping', () => {
    it('should send typing status', () => {
      component.selectedConversation.set(mockConversation);
      
      component.onTyping();
      
      expect(chatServiceSpy.sendTypingStatus).toHaveBeenCalledWith(
        mockConversation.partner._id,
        true
      );
    });

    it('should not send if no conversation selected', () => {
      component.onTyping();
      
      expect(chatServiceSpy.sendTypingStatus).not.toHaveBeenCalled();
    });
  });

  describe('getPartnerName', () => {
    it('should return full name', () => {
      const result = component.getPartnerName(mockConversation);
      expect(result).toBe('Jane Smith');
    });
  });

  describe('getPartnerInitials', () => {
    it('should return initials', () => {
      const result = component.getPartnerInitials(mockConversation);
      expect(result).toBe('JS');
    });

    it('should handle missing names', () => {
      const conversation = {
        ...mockConversation,
        partner: { ...mockConversation.partner, prenom: '', nom: '' },
      };
      const result = component.getPartnerInitials(conversation);
      expect(result).toBe('');
    });
  });

  describe('formatTime', () => {
    it('should format recent time', () => {
      const now = new Date();
      const result = component.formatTime(now.toISOString());
      expect(result).toBe('À l\'instant');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60000);
      const result = component.formatTime(date.toISOString());
      expect(result).toBe('Il y a 5 min');
    });

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 2 * 3600000);
      const result = component.formatTime(date.toISOString());
      expect(result).toBe('Il y a 2 h');
    });

    it('should format days ago', () => {
      const date = new Date(Date.now() - 3 * 86400000);
      const result = component.formatTime(date.toISOString());
      expect(result).toBe('Il y a 3 j');
    });
  });

  describe('isMessageFromMe', () => {
    it('should return true for my message', () => {
      component.currentUser.set(mockUser);
      const result = component.isMessageFromMe(mockMessage);
      expect(result).toBe(true);
    });

    it('should return false for other message', () => {
      component.currentUser.set({
        ...mockUser,
        _id: 'different-id',
      });
      const result = component.isMessageFromMe(mockMessage);
      expect(result).toBe(false);
    });
  });

  describe('handleNewMessage', () => {
    it('should add message if from selected conversation', () => {
      component.selectedConversation.set(mockConversation);
      component.messages.set([]);
      
      component['handleNewMessage'](mockMessage);
      
      expect(component.messages()).toContain(mockMessage);
      expect(chatServiceSpy.markAsRead).toHaveBeenCalledWith(mockMessage._id);
    });

    it('should reload conversations if from other conversation', () => {
      component.selectedConversation.set({
        ...mockConversation,
        partner: { ...mockConversation.partner, _id: 'different-id' },
      });
      spyOn(component, 'loadConversations');
      
      component['handleNewMessage'](mockMessage);
      
      expect(component.loadConversations).toHaveBeenCalled();
    });
  });

  describe('handleMessageRead', () => {
    it('should mark message as read', () => {
      component.messages.set([mockMessage]);
      
      component['handleMessageRead'](mockMessage._id);
      
      expect(component.messages()[0].read).toBe(true);
    });
  });
});
