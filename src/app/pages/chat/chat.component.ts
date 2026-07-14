import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, Conversation } from '../../services/chat.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private apiService = inject(ApiService);

  // State
  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<ChatMessage[]>([]);
  newMessage = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  
  // New conversation state
  showNewConversation = signal(false);
  availableUsers = signal<User[]>([]);
  searchQuery = signal('');
  selectedUser = signal<User | null>(null);
  
  // Typing indicator
  isTyping = signal(false);
  typingTimeout: any;
  
  // Current user
  currentUser = signal<User | null>(null);
  currentUserId = computed(() => this.currentUser()?._id);
  userRole = computed(() => this.currentUser()?.role);
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadCurrentUser();
    this.chatService.connectSocket();
    this.setupSocketListeners();
    this.loadConversations();
  }

  ngOnDestroy() {
    this.chatService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser.set(JSON.parse(userStr));
    } else {
      // Fallback: construct user from individual localStorage keys
      const user: User = {
        _id: localStorage.getItem('user_id') || '',
        nom: localStorage.getItem('user_nom') || '',
        prenom: localStorage.getItem('user_prenom') || '',
        email: localStorage.getItem('user_email') || '',
        role: (localStorage.getItem('user_role') as 'ADMIN' | 'IT' | 'CONSULTANT') || 'CONSULTANT',
        status: 'active',
        isConsultant: false,
        profilePicture: localStorage.getItem('user_profile_picture') || '',
      };
      if (user._id) {
        this.currentUser.set(user);
        console.log('Loaded user from individual localStorage keys:', user);
      }
    }
  }

  private setupSocketListeners() {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(message => {
        if (message) {
          this.handleNewMessage(message);
        }
      }),
      this.chatService.messageRead$.subscribe(data => {
        if (data) {
          this.handleMessageRead(data.messageId);
        }
      }),
      this.chatService.typing$.subscribe(data => {
        if (data && this.selectedConversation()) {
          const partnerId = this.selectedConversation()!.partner._id;
          if (data.userId === partnerId) {
            this.isTyping.set(data.isTyping);
            if (data.isTyping) {
              this.typingTimeout = setTimeout(() => {
                this.isTyping.set(false);
              }, 3000);
            }
          }
        }
      })
    );
  }

  private handleNewMessage(message: ChatMessage) {
    const currentUserId = this.currentUserId();
    if (!currentUserId) return;

    const isFromSelected = this.selectedConversation()?.partner._id === message.sender._id;
    
    if (isFromSelected) {
      // Add message to current conversation
      this.messages.update(msgs => [...msgs, message]);
      // Mark as read
      this.chatService.markAsRead(message._id);
    } else {
      // Reload conversations to update unread counts
      this.loadConversations();
    }
  }

  private handleMessageRead(messageId: string) {
    this.messages.update(msgs => 
      msgs.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      )
    );
  }

  async loadConversations() {
    this.loading.set(true);
    try {
      const convs = await firstValueFrom(this.chatService.getConversations());
      console.log('Loaded conversations:', convs);
      convs.forEach((conv, index) => {
        console.log(`Conversation ${index}:`, conv);
        console.log(`Partner:`, conv.partner);
      });
      this.conversations.set(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      this.error.set('Failed to load conversations');
    } finally {
      this.loading.set(false);
    }
  }

  async loadAvailableUsers() {
    this.loading.set(true);
    try {
      const users = await firstValueFrom(this.apiService.getUsers());
      console.log('Loaded users:', users);
      const currentUserId = this.currentUserId();
      const userRole = this.userRole();
      console.log('Current user ID:', currentUserId, 'Role:', userRole);
      
      // Filter users based on role-based chat rules
      // IT ↔ Consultant (allowed)
      // IT ↔ Admin (allowed)
      // Admin ↔ IT (allowed)
      // Admin ↔ Consultant (NOT allowed)
      // Consultant ↔ Consultant (NOT allowed)
      // Consultant ↔ Admin (NOT allowed)
      let filteredUsers: User[];
      if (userRole === 'CONSULTANT') {
        // Consultants can only chat with IT (NOT Admin)
        filteredUsers = users.filter(u => 
          u._id !== currentUserId && u.role === 'IT'
        );
      } else if (userRole === 'IT') {
        // IT can chat with Consultants and ADMIN
        filteredUsers = users.filter(u => 
          u._id !== currentUserId && (u.role === 'CONSULTANT' || u.role === 'ADMIN')
        );
      } else if (userRole === 'ADMIN') {
        // Admin can only chat with IT (NOT Consultants)
        filteredUsers = users.filter(u => 
          u._id !== currentUserId && u.role === 'IT'
        );
      } else {
        // Other roles: no chat allowed
        filteredUsers = [];
      }
      
      console.log('Filtered users by role:', filteredUsers);
      
      // Don't filter out users who already have conversations - allow re-selecting them
      // const existingPartnerIds = this.conversations().map(c => c.partner._id);
      // console.log('Existing partner IDs:', existingPartnerIds);
      // filteredUsers = filteredUsers.filter(u => !existingPartnerIds.includes(u._id));
      
      console.log('Final available users:', filteredUsers);
      this.availableUsers.set(filteredUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      this.error.set('Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  openNewConversation() {
    this.showNewConversation.set(true);
    this.searchQuery.set('');
    this.selectedUser.set(null);
    this.loadAvailableUsers();
  }

  closeNewConversation() {
    this.showNewConversation.set(false);
    this.selectedUser.set(null);
    this.searchQuery.set('');
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
  }

  async startConversation() {
    const user = this.selectedUser();
    if (!user) return;

    // Create a temporary conversation object
    const tempConversation: Conversation = {
      partner: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
      lastMessage: {
        _id: '',
        sender: { _id: '', nom: '', prenom: '', email: '' },
        receiver: { _id: '', nom: '', prenom: '', email: '' },
        message: 'Nouvelle conversation',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      unreadCount: 0,
    };

    this.selectedConversation.set(tempConversation);
    this.messages.set([]);
    this.closeNewConversation();
  }

  async selectConversation(conversation: Conversation) {
    this.selectedConversation.set(conversation);
    this.messages.set([]);
    this.loading.set(true);
    
    try {
      const msgs = await firstValueFrom(this.chatService.getConversation(conversation.partner._id));
      this.messages.set(msgs.reverse());
      
      // Mark conversation as read
      this.chatService.joinConversation(conversation.partner._id);
      
      // Update unread count
      this.conversations.update(convs => 
        convs.map(c => 
          c.partner._id === conversation.partner._id 
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    } catch (err) {
      this.error.set('Failed to load messages');
    } finally {
      this.loading.set(false);
    }
  }

  sendMessage() {
    const message = this.newMessage().trim();
    if (!message || !this.selectedConversation()) return;

    const receiverId = this.selectedConversation()!.partner._id;
    
    this.chatService.sendMessage(receiverId, message).subscribe({
      next: (sentMessage) => {
        this.messages.update(msgs => [...msgs, sentMessage]);
        this.newMessage.set('');
        
        // If this was the first message, reload conversations
        if (this.messages().length === 1) {
          this.loadConversations();
        }
      },
      error: () => {
        this.error.set('Failed to send message');
      }
    });
  }

  onTyping() {
    if (!this.selectedConversation()) return;
    
    this.chatService.sendTypingStatus(this.selectedConversation()!.partner._id, true);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.chatService.sendTypingStatus(this.selectedConversation()!.partner._id, false);
    }, 1000);
  }

  getPartnerName(conversation: Conversation): string {
    const partner = conversation.partner;
    console.log('getPartnerName - partner:', partner);
    console.log('getPartnerName - partner.prenom:', partner.prenom, 'partner.nom:', partner.nom);
    return `${partner.prenom} ${partner.nom}`;
  }

  getPartnerInitials(conversation: Conversation): string {
    const partner = conversation.partner;
    return `${partner.prenom?.[0] || ''}${partner.nom?.[0] || ''}`.toUpperCase();
  }

  getUserName(user: User): string {
    return `${user.prenom} ${user.nom}`;
  }

  getUserInitials(user: User): string {
    return `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR');
  }

  isMessageFromMe(message: ChatMessage): boolean {
    return message.sender._id === this.currentUserId();
  }

  get filteredUsers(): User[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.availableUsers();
    
    return this.availableUsers().filter(user => 
      user.nom.toLowerCase().includes(query) ||
      user.prenom.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }
}

