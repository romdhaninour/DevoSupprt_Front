import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ChatComponent } from './chat.component';
import { ChatService, ChatMessage, Conversation } from '../../services/chat.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatServiceSpy: jasmine.SpyObj<ChatService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

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
    const chatSpy = jasmine.createSpyObj('ChatService', [
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
      reaction$: of(null),
    });

    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUsers',
    ]);

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: ChatService, useValue: chatSpy },
        { provide: ApiService, useValue: apiSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatServiceSpy = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  afterEach(() => {
    localStorage.removeItem('user');
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
      const messageFromPartner = {
        ...mockMessage,
        sender: { ...mockMessage.sender, _id: mockConversation.partner._id }
      };
      component.currentUser.set(mockUser);
      component.selectedConversation.set(mockConversation);
      component.messages.set([]);
      
      component['handleNewMessage'](messageFromPartner);
      
      expect(component.messages()).toContain(messageFromPartner);
      expect(chatServiceSpy.markAsRead).toHaveBeenCalledWith(messageFromPartner._id);
    });

    it('should reload conversations if from other conversation', () => {
      component.currentUser.set(mockUser);
      component.selectedConversation.set({
        ...mockConversation,
        partner: { ...mockConversation.partner, _id: 'different-id' },
      });
      spyOn(component, 'loadConversations');
      
      component['handleNewMessage'](mockMessage);
      
      expect(component.loadConversations).toHaveBeenCalled();
    });

    it('should not process message if no current user', () => {
      component.currentUser.set(null);
      component.selectedConversation.set(mockConversation);
      component.messages.set([]);
      
      component['handleNewMessage'](mockMessage);
      
      expect(component.messages()).toEqual([]);
      expect(chatServiceSpy.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('handleMessageRead', () => {
    it('should mark message as read', () => {
      component.messages.set([mockMessage]);
      
      component['handleMessageRead'](mockMessage._id);
      
      expect(component.messages()[0].read).toBe(true);
    });
  });

  describe('isMine', () => {
    it('should return true for own message', () => {
      component.currentUser.set(mockUser);
      expect(component.isMine(mockMessage)).toBeTrue();
    });

    it('should return false for other message', () => {
      component.currentUser.set({ ...mockUser, _id: 'other' });
      expect(component.isMine(mockMessage)).toBeFalse();
    });

    it('should return false if sender is undefined', () => {
      component.currentUser.set(mockUser);
      expect(component.isMine({ sender: undefined })).toBeFalse();
    });
  });

  describe('hasActiveChat', () => {
    it('should return true when conversation is selected', () => {
      component.selectedConversation.set(mockConversation);
      expect(component.hasActiveChat).toBeTrue();
    });

    it('should return false when no conversation selected', () => {
      component.selectedConversation.set(null);
      expect(component.hasActiveChat).toBeFalse();
    });
  });

  describe('chatPartnerName', () => {
    it('should return partner full name from selected conversation', () => {
      component.selectedConversation.set(mockConversation);
      expect(component.chatPartnerName).toBe('Jane Smith');
    });

    it('should return empty string when no conversation', () => {
      component.selectedConversation.set(null);
      expect(component.chatPartnerName).toBe('');
    });
  });

  describe('chatPartnerEmail', () => {
    it('should return partner email from selected conversation', () => {
      component.selectedConversation.set(mockConversation);
      expect(component.chatPartnerEmail).toBe('jane.smith@example.com');
    });

    it('should return empty string when no conversation', () => {
      component.selectedConversation.set(null);
      expect(component.chatPartnerEmail).toBe('');
    });
  });

  describe('chatPartnerRole', () => {
    it('should return partner role from selected conversation', () => {
      component.selectedConversation.set(mockConversation);
      expect(component.chatPartnerRole).toBe('CONSULTANT');
    });

    it('should return empty string when no conversation', () => {
      component.selectedConversation.set(null);
      expect(component.chatPartnerRole).toBe('');
    });
  });

  describe('chatPartnerInitials', () => {
    it('should return partner initials from selected conversation', () => {
      component.selectedConversation.set(mockConversation);
      expect(component.chatPartnerInitials).toBe('JS');
    });

    it('should return empty string when no conversation', () => {
      component.selectedConversation.set(null);
      expect(component.chatPartnerInitials).toBe('');
    });
  });

  describe('unreadCount', () => {
    it('should return unread count for a specific user', () => {
      component.conversations.set([
        { ...mockConversation, unreadCount: 3 },
      ]);
      expect(component.unreadCount(mockConversation.partner._id)).toBe(3);
    });

    it('should return 0 when user not found', () => {
      component.conversations.set([]);
      expect(component.unreadCount('nonexistent')).toBe(0);
    });
  });

  describe('openNewConversation / closeNewConversation', () => {
    it('should set showNewConversation to true', () => {
      component.openNewConversation();
      expect(component.showNewConversation()).toBeTrue();
    });

    it('should close and reset new conversation state', () => {
      component.showNewConversation.set(true);
      component.selectedUser.set(mockUser);
      component.searchQuery.set('test');
      component.closeNewConversation();
      expect(component.showNewConversation()).toBeFalse();
      expect(component.selectedUser()).toBeNull();
      expect(component.searchQuery()).toBe('');
    });
  });

  describe('cancelImage', () => {
    it('should reset image state', () => {
      component.selectedFile = new File([''], 'test.jpg');
      component.previewImage = 'data:image/jpeg;base64,xxx';
      component.cancelImage();
      expect(component.selectedFile).toBeNull();
      expect(component.previewImage).toBeNull();
    });
  });

  describe('toggleEmojiPicker', () => {
    it('should toggle showEmojiPicker', () => {
      component.showEmojiPicker.set(false);
      component.toggleEmojiPicker();
      expect(component.showEmojiPicker()).toBeTrue();
      component.toggleEmojiPicker();
      expect(component.showEmojiPicker()).toBeFalse();
    });
  });

  describe('addEmoji', () => {
    it('should append emoji to newMessage', () => {
      component.newMessage.set('Hello ');
      component.addEmoji('😊');
      expect(component.newMessage()).toBe('Hello 😊');
    });
  });

  describe('openLightbox / closeLightbox', () => {
    it('should set and clear lightboxImage', () => {
      component.openLightbox('image-url');
      expect(component.lightboxImage).toBe('image-url');
      component.closeLightbox();
      expect(component.lightboxImage).toBeNull();
    });
  });

  describe('onSearchChange', () => {
    it('should set searchQuery', () => {
      component.onSearchChange('test query');
      expect(component.searchQuery()).toBe('test query');
    });
  });

  describe('handleKeyDown', () => {
    it('should send message on Enter without shift', () => {
      spyOn(component, 'sendMessage');
      component.handleKeyDown({ key: 'Enter', shiftKey: false, preventDefault: () => {} } as any);
      expect(component.sendMessage).toHaveBeenCalled();
    });

    it('should not send message if Shift is pressed', () => {
      spyOn(component, 'sendMessage');
      component.handleKeyDown({ key: 'Enter', shiftKey: true, preventDefault: () => {} } as any);
      expect(component.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('loadCurrentUser with localStorage fallback', () => {
    it('should build user from individual localStorage keys', () => {
      localStorage.removeItem('user');
      localStorage.setItem('user_id', 'local-id');
      localStorage.setItem('user_nom', 'Local');
      localStorage.setItem('user_prenom', 'User');
      localStorage.setItem('user_email', 'local@test.com');
      localStorage.setItem('user_role', 'IT');

      component['loadCurrentUser']();

      expect(component.currentUser()?._id).toBe('local-id');
      expect(component.currentUser()?.nom).toBe('Local');
    });
  });

  describe('loadAvailableUsers', () => {
    it('should filter users by role for ADMIN', async () => {
      component.currentUser.set(mockUser);
      apiServiceSpy.getUsers.and.returnValue(of([
        { _id: '1', role: 'CONSULTANT' },
        { _id: '2', role: 'IT' },
        { _id: '3', role: 'ADMIN' },
      ] as any));

      await component.loadAvailableUsers();

      expect(component.availableUsers().length).toBe(1);
      expect(component.availableUsers()[0].role).toBe('IT');
    });

    it('should handle error', async () => {
      component.currentUser.set(mockUser);
      apiServiceSpy.getUsers.and.returnValue(throwError(() => new Error('fail')));

      await component.loadAvailableUsers();

      expect(component.availableUsers()).toEqual([]);
    });
  });

  describe('selectUserFromList', () => {
    it('should create temp conversation for new user', () => {
      component.conversations.set([]);
      component.selectedConversation.set(null);

      component.selectUserFromList(mockUser);

      expect(component.selectedConversation()?.partner._id).toBe(mockUser._id);
      expect(component.showNewConversation()).toBeFalse();
    });

    it('should use existing conversation if available', () => {
      const existingConv = { ...mockConversation, partner: { ...mockConversation.partner, _id: mockUser._id } };
      component.conversations.set([existingConv]);
      spyOn(component, 'selectConversation');

      component.selectUserFromList(mockUser);

      expect(component.selectConversation).toHaveBeenCalledWith(existingConv);
    });
  });

  describe('isUserOnline', () => {
    it('should return false', () => {
      expect(component.isUserOnline('any-id')).toBeFalse();
    });
  });

  describe('onMessageInput', () => {
    it('should update newMessage signal', () => {
      component.onMessageInput('test message');
      expect(component.newMessage()).toBe('test message');
    });
  });
});
