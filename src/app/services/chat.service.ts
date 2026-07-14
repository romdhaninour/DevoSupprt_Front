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

    this.socket = io(this.apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      this.newMessageSubject.next(message);
    });

    this.socket.on('message_read', (data: { messageId: string }) => {
      this.messageReadSubject.next(data);
    });

    this.socket.on('unread_count', (count: number) => {
      this.unreadCountSubject.next(count);
    });

    this.socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
      this.typingSubject.next(data);
    });

    this.socket.on('conversation_read', (data: { by: string }) => {
      // Handle conversation read event
      console.log('Conversation read by:', data.by);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(receiverId: string, message: string): Observable<ChatMessage> {
    if (this.socket) {
      this.socket.emit('send_message', { receiverId, message });
      return new Observable(observer => {
        this.socket?.once('message_sent', (message: ChatMessage) => {
          observer.next(message);
          observer.complete();
        });
      });
    }
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
}
