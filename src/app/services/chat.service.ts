import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from './api.service';

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    profilePicture?: string;
  };
  receiver: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    profilePicture?: string;
  };
  message: string;
  imageUrl?: string;
  reactions?: { emoji: string; userId: { _id: string; nom: string; prenom: string } }[];
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  partner: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    profilePicture?: string;
    role: string;
  };
  lastMessage: ChatMessage;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null = null;
  private apiUrl = 'http://localhost:3000';
  
  // BehaviorSubjects for real-time updates
  private newMessageSubject = new BehaviorSubject<ChatMessage | null>(null);
  newMessage$ = this.newMessageSubject.asObservable();
  
  private messageReadSubject = new BehaviorSubject<{ messageId: string } | null>(null);
  messageRead$ = this.messageReadSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();
  
  private typingSubject = new BehaviorSubject<{ userId: string; isTyping: boolean } | null>(null);
  typing$ = this.typingSubject.asObservable();

  private reactionSubject = new BehaviorSubject<{ messageId: string; reactions: any[] } | null>(null);
  reaction$ = this.reactionSubject.asObservable();

  constructor(private http: HttpClient, private apiService: ApiService) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  connectSocket() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.socket = io(`${this.apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server, socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      console.log('Received new_message event:', message);
      this.newMessageSubject.next(message);
    });

    this.socket.on('message_read', (data: { messageId: string }) => {
      console.log('Received message_read event:', data);
      this.messageReadSubject.next(data);
    });

    this.socket.on('unread_count', (count: number) => {
      console.log('Received unread_count event:', count);
      this.unreadCountSubject.next(count);
    });

    this.socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
      console.log('Received user_typing event:', data);
      this.typingSubject.next(data);
    });

    this.socket.on('message_reaction', (data: { messageId: string; reactions: any[] }) => {
      console.log('Received message_reaction event:', data);
      this.reactionSubject.next(data);
    });

    this.socket.on('message_sent', (message: ChatMessage) => {
      console.log('Received message_sent event:', message);
    });

    this.socket.on('conversation_read', (data: { by: string }) => {
      console.log('Received conversation_read event:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(receiverId: string, message: string, imageUrl?: string): Observable<ChatMessage> {
    console.log('Sending message via socket:', { receiverId, message, imageUrl });
    console.log('Socket status:', {
      connected: this.socket?.connected,
      id: this.socket?.id,
      hasListeners: this.socket?.hasListeners('message_sent')
    });
    
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', { receiverId, message, imageUrl });
      console.log('Message emitted to socket');
      return new Observable(observer => {
        this.socket?.once('message_sent', (message: ChatMessage) => {
          console.log('Message sent confirmation received:', message);
          observer.next(message);
          observer.complete();
        });
        
        // Add timeout to handle case where confirmation never comes
        setTimeout(() => {
          console.error('Message confirmation timeout');
          observer.error(new Error('Message confirmation timeout'));
        }, 10000);
      });
    }
    console.error('Socket not connected');
    throw new Error('Socket not connected');
  }

  markAsRead(messageId: string) {
    if (this.socket) {
      this.socket.emit('mark_as_read', { messageId });
    }
  }

  joinConversation(userId: string) {
    if (this.socket) {
      this.socket.emit('join_conversation', { userId });
    }
  }

  sendTypingStatus(receiverId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
  }

  toggleReaction(messageId: string, emoji: string) {
    if (this.socket) {
      this.socket.emit('toggle_reaction', { messageId, emoji });
    }
  }

  // REST API methods
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/chats/conversations`, this.getAuthHeaders());
  }

  getConversation(userId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chats/conversation/${userId}`, this.getAuthHeaders());
  }

  getUnreadMessages(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chats/unread`, this.getAuthHeaders());
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    console.log('Uploading to:', `${this.apiUrl}/chats/upload`);
    console.log('File:', file.name, file.size, file.type);
    return this.http.post<{ url: string }>(`${this.apiUrl}/chats/upload`, formData, this.getAuthHeaders());
  }
}
