import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, Conversation } from '../../services/chat.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('emojiPicker') emojiPickerRef!: ElementRef;

  private chatService = inject(ChatService);
  private apiService = inject(ApiService);

  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<ChatMessage[]>([]);
  newMessage = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  showNewConversation = signal(false);
  availableUsers = signal<User[]>([]);
  searchQuery = signal('');
  selectedUser = signal<User | null>(null);

  isTyping = signal(false);
  typingUser = signal<string>('');
  typingTimeout: any;
  loadingMessages = signal(false);

  currentUser = signal<User | null>(null);
  currentUserId = computed(() => this.currentUser()?._id);
  userRole = computed(() => this.currentUser()?.role);

  showEmojiPicker = signal(false);
  activeReactionPicker = signal<string | null>(null);
  commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];
  reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '💯', '🙏'];
  previewImage: string | null = null;
  selectedFile: File | null = null;
  lightboxImage: string | null = null;
  sending = signal(false);

  groupedMessages = computed(() => {
    const msgs = this.messages();
    if (!msgs.length) return [];

    const groups: { date: string; messages: any[] }[] = [];
    let currentGroup: { date: string; messages: any[] } | null = null;

    for (const msg of msgs) {
      const date = new Date(msg.createdAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!currentGroup || currentGroup.date !== date) {
        currentGroup = { date, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    }

    return groups;
  });

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadCurrentUser();
    this.chatService.connectSocket();
    this.setupSocketListeners();
    this.loadConversations();

    this.chatService.reaction$.subscribe(data => {
      if (!data) return;
      this.messages.set(this.messages().map(m =>
        m._id === data.messageId ? { ...m, reactions: data.reactions } : m
      ));
    });
  }

  ngOnDestroy() {
    this.showEmojiPicker.set(false);
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
        if (data) {
          const partnerId = this.getActivePartnerId();
          if (partnerId && data.userId === partnerId) {
            this.isTyping.set(data.isTyping);
            if (data.isTyping) {
              const partner = this.getPartnerInfo();
              this.typingUser.set(partner ? `${partner.prenom} ${partner.nom}` : '');
              if (this.typingTimeout) clearTimeout(this.typingTimeout);
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

    const partnerId = this.getActivePartnerId();
    const isFromSelected = partnerId && message.sender._id === partnerId;

    if (isFromSelected) {
      this.messages.update(msgs => [...msgs, message]);
      this.chatService.markAsRead(message._id);
    } else {
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

  getActivePartnerId(): string | null {
    if (this.selectedUser()) return this.selectedUser()!._id;
    if (this.selectedConversation()) return this.selectedConversation()!.partner._id;
    return null;
  }

  private getPartnerInfo(): { prenom: string; nom: string } | null {
    if (this.selectedUser()) {
      return { prenom: this.selectedUser()!.prenom, nom: this.selectedUser()!.nom };
    }
    if (this.selectedConversation()) {
      const p = this.selectedConversation()!.partner;
      return { prenom: p.prenom, nom: p.nom };
    }
    return null;
  }

  async loadConversations() {
    this.loading.set(true);
    try {
      const convs = await firstValueFrom(this.chatService.getConversations());
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
      const currentUserId = this.currentUserId();
      const userRole = this.userRole();

      let filteredUsers: User[];
      if (userRole === 'CONSULTANT') {
        filteredUsers = users.filter(u => u._id !== currentUserId && u.role === 'IT');
      } else if (userRole === 'IT') {
        filteredUsers = users.filter(u => u._id !== currentUserId && (u.role === 'CONSULTANT' || u.role === 'ADMIN'));
      } else if (userRole === 'ADMIN') {
        filteredUsers = users.filter(u => u._id !== currentUserId && u.role === 'IT');
      } else {
        filteredUsers = [];
      }

      this.availableUsers.set(filteredUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
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

  selectConversation(conversation: Conversation) {
    this.selectedConversation.set(conversation);
    this.messages.set([]);
    this.loadingMessages.set(true);

    this.chatService.getConversation(conversation.partner._id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs.reverse());
        this.chatService.joinConversation(conversation.partner._id);

        this.conversations.update(convs =>
          convs.map(c =>
            c.partner._id === conversation.partner._id
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.error.set('Failed to load messages');
      },
      complete: () => {
        this.loadingMessages.set(false);
      }
    });
  }

  selectUserFromList(user: User) {
    const existingConv = this.conversations().find(c => c.partner._id === user._id);
    if (existingConv) {
      this.selectConversation(existingConv);
    } else {
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
          message: '',
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        unreadCount: 0,
      };
      this.selectedConversation.set(tempConversation);
      this.messages.set([]);
    }
    this.selectedUser.set(user);
    this.closeNewConversation();
  }

  sendMessage() {
    const message = this.newMessage().trim();
    const partnerId = this.getActivePartnerId();
    if ((!message && !this.selectedFile) || !partnerId || this.sending()) return;

    this.sending.set(true);

    if (this.selectedFile) {
      console.log('Uploading image:', this.selectedFile.name, this.selectedFile.size);
      this.chatService.uploadImage(this.selectedFile).subscribe({
        next: (res) => {
          console.log('Image uploaded successfully:', res);
          this.chatService.sendMessage(partnerId, message || '', res.url).subscribe({
            next: (msg) => {
              console.log('Message sent with image:', msg);
              this.messages.set([...this.messages(), msg]);
              this.newMessage.set('');
              this.selectedFile = null;
              this.previewImage = null;
              this.sending.set(false);
            },
            error: (err) => {
              console.error('Error sending message with image:', err);
              this.sending.set(false);
            }
          });
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          alert('Failed to upload image. Please try again.');
          this.sending.set(false);
        }
      });
    } else {
      this.chatService.sendMessage(partnerId, message).subscribe({
        next: (msg) => {
          this.messages.set([...this.messages(), msg]);
          this.newMessage.set('');
          this.sending.set(false);
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.error.set('Failed to send message');
          this.sending.set(false);
        }
      });
    }
  }

  onTyping() {
    const partnerId = this.getActivePartnerId();
    if (!partnerId) return;

    this.chatService.sendTypingStatus(partnerId, true);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.chatService.sendTypingStatus(partnerId, false);
    }, 1000);
  }

  getPartnerName(conversation: Conversation): string {
    return `${conversation.partner.prenom} ${conversation.partner.nom}`;
  }

  getPartnerInitials(conversation: Conversation): string {
    const p = conversation.partner;
    return `${p.prenom?.[0] || ''}${p.nom?.[0] || ''}`.toUpperCase();
  }

  formatTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) { return "À l'instant"; }
    if (minutes < 60) { return `Il y a ${minutes} min`; }
    if (hours < 24) { return `Il y a ${hours} h`; }
    return `Il y a ${days} j`;
  }

  isMessageFromMe(message: ChatMessage): boolean {
    const senderId = String(message.sender?._id || message.sender);
    const myId = String(this.currentUserId());
    return senderId === myId;
  }

  isMine(msg: any): boolean {
    const senderId = String(msg?.sender?._id || msg?.sender || '');
    const myId = String(this.currentUserId() || '');
    return senderId !== '' && myId !== '' && senderId === myId;
  }

  toggleReaction(messageId: string, emoji: string) {
    this.chatService.toggleReaction(messageId, emoji);
    this.activeReactionPicker.set(null);
  }

  toggleReactionPicker(messageId: string) {
    if (this.activeReactionPicker() === messageId) {
      this.activeReactionPicker.set(null);
    } else {
      this.activeReactionPicker.set(messageId);
    }
  }

  isReactionPickerOpen(messageId: string): boolean {
    return this.activeReactionPicker() === messageId;
  }

  getUniqueReactions(messageId: string): { emoji: string; count: number; reacted: boolean }[] {
    const msg = this.messages().find(m => m._id === messageId);
    if (!msg?.reactions || !msg.reactions.length) return [];

    const myId = String(this.currentUserId() || '');
    const map = new Map<string, { count: number; reacted: boolean }>();
    for (const r of msg.reactions) {
      const existing = map.get(r.emoji) || { count: 0, reacted: false };
      existing.count++;
      const rUserId = String(r.userId?._id || r.userId || '');
      if (rUserId && rUserId === myId) existing.reacted = true;
      map.set(r.emoji, existing);
    }
    return Array.from(map.entries()).map(([emoji, data]) => ({ emoji, ...data }));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.previewImage = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  cancelImage() {
    this.selectedFile = null;
    this.previewImage = null;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker.update(v => !v);
  }

  addEmoji(emoji: string) {
    this.newMessage.set(this.newMessage() + emoji);
    this.showEmojiPicker.set(false);
  }

  openLightbox(url: string) {
    this.lightboxImage = this.resolveImageUrl(url);
  }

  closeLightbox() {
    this.lightboxImage = null;
  }

  resolveImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return environment.apiUrl + url;
    try {
      const parsed = new URL(url);
      const apiHost = new URL(environment.apiUrl).host;
      const isLocalHost = ['localhost', '0.0.0.0', '127.0.0.1'].includes(parsed.hostname);
      if (isLocalHost || parsed.host === apiHost) {
        return environment.apiUrl + parsed.pathname + parsed.search;
      }
      return url;
    } catch {
      return url;
    }
  }

  onMessageInput(value: string) {
    this.newMessage.set(value);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isUserOnline(userId: string): boolean {
    return false;
  }

  unreadCount(userId: string): number {
    const conv = this.conversations().find(c => c.partner._id === userId);
    return conv?.unreadCount || 0;
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
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

  get hasActiveChat(): boolean {
    return !!(this.selectedConversation() || this.selectedUser());
  }

  closeChat() {
    this.selectedConversation.set(null);
    this.selectedUser.set(null);
    this.messages.set([]);
    this.newMessage.set('');
  }

  get chatPartnerName(): string {
    if (this.selectedUser()) return `${this.selectedUser()!.prenom} ${this.selectedUser()!.nom}`;
    if (this.selectedConversation()) return this.getPartnerName(this.selectedConversation()!);
    return '';
  }

  get chatPartnerEmail(): string {
    if (this.selectedUser()) return this.selectedUser()!.email;
    if (this.selectedConversation()) return this.selectedConversation()!.partner.email;
    return '';
  }

  get chatPartnerRole(): string {
    if (this.selectedUser()) return this.selectedUser()!.role;
    if (this.selectedConversation()) return this.selectedConversation()!.partner.role;
    return '';
  }

  get chatPartnerInitials(): string {
    if (this.selectedUser()) {
      const u = this.selectedUser()!;
      return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
    }
    if (this.selectedConversation()) return this.getPartnerInitials(this.selectedConversation()!);
    return '';
  }
}
