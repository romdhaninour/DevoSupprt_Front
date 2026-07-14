import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TicketsComponent } from './tickets.component';
import { ApiService } from '../../services/api.service';
import { TicketStatus, TicketPriority, IssueType, ResolutionType } from '../../models/ticket.model';
import { User } from '../../models/user.model';

describe('TicketsComponent', () => {
  let component: TicketsComponent;
  let fixture: ComponentFixture<TicketsComponent>;
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

  const mockTicket = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Ticket',
    description: 'Test description',
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    issueType: IssueType.MALFUNCTION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: mockUser,
    device: { _id: 'device1', name: 'Test Device', type: 'LAPTOP' },
    assignedTo: undefined,
    comments: [],
  };

  const mockITStaff = [
    { ...mockUser, _id: 'it1', role: 'IT' as const, nom: 'IT', prenom: 'Staff' },
    { ...mockUser, _id: 'it2', role: 'IT' as const, nom: 'IT', prenom: 'Admin' },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getTickets',
      'getTicket',
      'createTicket',
      'updateTicketStatus',
      'assignTicket',
      'addTicketComment',
      'deleteTicket',
      'getUsers',
      'getConsultants',
    ]);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [TicketsComponent],
      providers: [
        { provide: ApiService, useValue: spy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketsComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Set up localStorage mock
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'user_role') return 'ADMIN';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load tickets on init', () => {
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [mockTicket], total: 1 }));
      
      component.ngOnInit();
      
      expect(apiServiceSpy.getTickets).toHaveBeenCalled();
    });

    it('should load IT staff if user is IT or ADMIN', () => {
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [], total: 0 }));
      apiServiceSpy.getUsers.and.returnValue(of(mockITStaff));
      
      component.ngOnInit();
      
      expect(apiServiceSpy.getUsers).toHaveBeenCalled();
    });
  });

  describe('loadTickets', () => {
    it('should load tickets and update signals', () => {
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [mockTicket], total: 1 }));
      
      component.loadTickets();
      
      expect(component.tickets()).toEqual([mockTicket]);
      expect(component.loading()).toBe(false);
    });

    it('should handle errors when loading tickets', () => {
      apiServiceSpy.getTickets.and.returnValue(throwError(() => new Error('Error')));
      
      component.loadTickets();
      
      expect(component.error()).toBe('Failed to load tickets');
      expect(component.loading()).toBe(false);
    });

    it('should apply filters when loading tickets', () => {
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [], total: 0 }));
      component.statusFilter.set('OPEN');
      component.priorityFilter.set('HIGH');
      
      component.loadTickets();
      
      expect(apiServiceSpy.getTickets).toHaveBeenCalledWith('OPEN', 'HIGH', undefined, undefined, undefined);
    });
  });

  describe('openCreateModal', () => {
    it('should open create modal and reset form', () => {
      component.openCreateModal();
      
      expect(component.showCreateModal()).toBe(true);
      expect(component.createForm()).toEqual({
        title: '',
        description: '',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
        deviceId: '',
      });
    });
  });

  describe('closeCreateModal', () => {
    it('should close create modal', () => {
      component.showCreateModal.set(true);
      component.closeCreateModal();
      
      expect(component.showCreateModal()).toBe(false);
    });
  });

  describe('createTicket', () => {
    it('should create a ticket successfully', () => {
      apiServiceSpy.createTicket.and.returnValue(of(mockTicket));
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [mockTicket], total: 1 }));
      
      component.createForm.set({
        title: 'New Ticket',
        description: 'Description',
        deviceId: 'device1',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      
      component.createTicket();
      
      expect(apiServiceSpy.createTicket).toHaveBeenCalled();
      expect(component.showCreateModal()).toBe(false);
    });

    it('should not create ticket if form is invalid', () => {
      component.createForm.set({
        title: '',
        description: '',
        deviceId: '',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      
      component.createTicket();
      
      expect(apiServiceSpy.createTicket).not.toHaveBeenCalled();
    });

    it('should handle errors when creating ticket', () => {
      apiServiceSpy.createTicket.and.returnValue(throwError(() => new Error('Error')));
      
      component.createForm.set({
        title: 'Test',
        description: 'Test',
        deviceId: 'device1',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      
      component.createTicket();
      
      expect(component.createError()).toBe('Failed to create ticket');
    });
  });

  describe('closeDetailModal', () => {
    it('should close detail modal', () => {
      component.showDetailModal.set(true);
      component.closeDetailModal();
      
      expect(component.showDetailModal()).toBe(false);
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status', () => {
      const updatedTicket = { ...mockTicket, status: TicketStatus.IN_PROGRESS };
      apiServiceSpy.updateTicketStatus.and.returnValue(of(updatedTicket));
      
      component.selectedTicket.set(mockTicket);
      component.updateTicketStatus(TicketStatus.IN_PROGRESS);
      
      expect(apiServiceSpy.updateTicketStatus).toHaveBeenCalledWith(
        mockTicket._id,
        { status: TicketStatus.IN_PROGRESS }
      );
      expect(component.selectedTicket()).toEqual(updatedTicket);
    });

    it('should update ticket status with resolution', () => {
      const updatedTicket = { ...mockTicket, status: TicketStatus.RESOLVED, resolution: ResolutionType.REPAIR };
      apiServiceSpy.updateTicketStatus.and.returnValue(of(updatedTicket));
      
      component.selectedTicket.set(mockTicket);
      component.updateTicketStatus(TicketStatus.RESOLVED, ResolutionType.REPAIR);
      
      expect(apiServiceSpy.updateTicketStatus).toHaveBeenCalledWith(
        mockTicket._id,
        { status: TicketStatus.RESOLVED, resolution: ResolutionType.REPAIR }
      );
    });

    it('should handle errors when updating status', () => {
      apiServiceSpy.updateTicketStatus.and.returnValue(throwError(() => new Error('Error')));
      
      component.selectedTicket.set(mockTicket);
      component.updateTicketStatus(TicketStatus.IN_PROGRESS);
      
      expect(component.error()).toBe('Failed to update ticket status');
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to user', () => {
      const assignedTicket = { ...mockTicket, assignedTo: mockITStaff[0] };
      apiServiceSpy.assignTicket.and.returnValue(of(assignedTicket));
      
      component.selectedTicket.set(mockTicket);
      component.assignTicket(mockITStaff[0]._id);
      
      expect(apiServiceSpy.assignTicket).toHaveBeenCalledWith(
        mockTicket._id,
        { assignedTo: mockITStaff[0]._id }
      );
      expect(component.selectedTicket()).toEqual(assignedTicket);
    });

    it('should handle errors when assigning ticket', () => {
      apiServiceSpy.assignTicket.and.returnValue(throwError(() => new Error('Error')));
      
      component.selectedTicket.set(mockTicket);
      component.assignTicket(mockITStaff[0]._id);
      
      expect(component.error()).toBe('Failed to assign ticket');
    });
  });

  describe('addComment', () => {
    it('should add comment to ticket', () => {
      const ticketWithComment = {
        ...mockTicket,
        comments: [{ author: mockUser, text: 'Test comment', createdAt: new Date() }]
      };
      apiServiceSpy.addTicketComment.and.returnValue(of(ticketWithComment));
      
      component.selectedTicket.set(mockTicket);
      component.newComment.set('Test comment');
      
      component.addComment();
      
      expect(apiServiceSpy.addTicketComment).toHaveBeenCalledWith(
        mockTicket._id,
        { text: 'Test comment' }
      );
      expect(component.newComment()).toBe('');
    });

    it('should not add empty comment', () => {
      component.selectedTicket.set(mockTicket);
      component.newComment.set('');
      
      component.addComment();
      
      expect(apiServiceSpy.addTicketComment).not.toHaveBeenCalled();
    });

    it('should handle errors when adding comment', () => {
      apiServiceSpy.addTicketComment.and.returnValue(throwError(() => new Error('Error')));
      
      component.selectedTicket.set(mockTicket);
      component.newComment.set('Test comment');
      
      component.addComment();
      
      expect(component.error()).toBe('Failed to add comment');
    });
  });

  describe('deleteTicket', () => {
    it('should delete ticket and close modal', () => {
      apiServiceSpy.deleteTicket.and.returnValue(of({ message: 'Ticket deleted successfully' }));
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [], total: 0 }));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.selectedTicket.set(mockTicket);
      component.deleteTicket();
      
      expect(apiServiceSpy.deleteTicket).toHaveBeenCalledWith(mockTicket._id);
      expect(component.showDetailModal()).toBe(false);
    });

    it('should not delete ticket if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.selectedTicket.set(mockTicket);
      component.deleteTicket();
      
      expect(apiServiceSpy.deleteTicket).not.toHaveBeenCalled();
    });

    it('should handle errors when deleting ticket', () => {
      apiServiceSpy.deleteTicket.and.returnValue(throwError(() => new Error('Error')));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.selectedTicket.set(mockTicket);
      component.deleteTicket();
      
      expect(component.error()).toBe('Failed to delete ticket');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct French labels', () => {
      expect(component.getStatusLabel(TicketStatus.OPEN)).toBe('Nouveau');
      expect(component.getStatusLabel(TicketStatus.IN_PROGRESS)).toBe('En cours');
      expect(component.getStatusLabel(TicketStatus.RESOLVED)).toBe('Résolu');
      expect(component.getStatusLabel(TicketStatus.CLOSED)).toBe('Fermé');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct French labels', () => {
      expect(component.getPriorityLabel(TicketPriority.LOW)).toBe('Faible');
      expect(component.getPriorityLabel(TicketPriority.MEDIUM)).toBe('Moyen');
      expect(component.getPriorityLabel(TicketPriority.HIGH)).toBe('Élevé');
    });
  });

  describe('getIssueTypeLabel', () => {
    it('should return correct French labels', () => {
      expect(component.getIssueTypeLabel(IssueType.DAMAGED)).toBe('Endommagé');
      expect(component.getIssueTypeLabel(IssueType.DESTROYED)).toBe('Détruit');
      expect(component.getIssueTypeLabel(IssueType.MALFUNCTION)).toBe('Dysfonctionnement');
      expect(component.getIssueTypeLabel(IssueType.OTHER)).toBe('Autre');
    });
  });

  describe('getResolutionLabel', () => {
    it('should return correct French labels', () => {
      expect(component.getResolutionLabel(ResolutionType.REPAIR)).toBe('Réparation');
      expect(component.getResolutionLabel(ResolutionType.REPLACE)).toBe('Remplacement');
    });
  });

  describe('getStaffDisplayName', () => {
    it('should return full name when available', () => {
      const staff = { ...mockUser, nom: 'Doe', prenom: 'John', email: 'john@example.com' };
      expect(component.getStaffDisplayName(staff)).toBe('John Doe');
    });

    it('should return email when name is not available', () => {
      const staff = { ...mockUser, nom: '', prenom: '', email: 'john@example.com' };
      expect(component.getStaffDisplayName(staff)).toBe('john@example.com');
    });

    it('should return fallback when email is not available', () => {
      const staff = { ...mockUser, nom: '', prenom: '', email: '' };
      expect(component.getStaffDisplayName(staff)).toBe('Utilisateur inconnu');
    });
  });

  describe('getCurrentUserInitials', () => {
    it('should return initials from user name', () => {
      expect(component.getCurrentUserInitials()).toBe('JD');
    });

    it('should return ? when user data is not available', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      expect(component.getCurrentUserInitials()).toBe('?');
    });
  });

  describe('isIT', () => {
    it('should return true for IT role', () => {
      spyOn(localStorage, 'getItem').and.returnValue('IT');
      component.ngOnInit();
      expect(component.isIT()).toBe(true);
    });

    it('should return true for ADMIN role', () => {
      spyOn(localStorage, 'getItem').and.returnValue('ADMIN');
      component.ngOnInit();
      expect(component.isIT()).toBe(true);
    });

    it('should return false for CONSULTANT role', () => {
      spyOn(localStorage, 'getItem').and.returnValue('CONSULTANT');
      component.ngOnInit();
      expect(component.isIT()).toBe(false);
    });
  });

  describe('getStatusClass', () => {
    it('should return correct CSS classes for each status', () => {
      expect(component.getStatusClass(TicketStatus.OPEN)).toContain('bg-emerald');
      expect(component.getStatusClass(TicketStatus.IN_PROGRESS)).toContain('bg-sky');
      expect(component.getStatusClass(TicketStatus.RESOLVED)).toContain('bg-violet');
      expect(component.getStatusClass(TicketStatus.CLOSED)).toContain('bg-gray');
    });
  });

  describe('getPriorityClass', () => {
    it('should return correct CSS classes for each priority', () => {
      expect(component.getPriorityClass(TicketPriority.LOW)).toContain('bg-blue');
      expect(component.getPriorityClass(TicketPriority.MEDIUM)).toContain('bg-amber');
      expect(component.getPriorityClass(TicketPriority.HIGH)).toContain('bg-red');
    });
  });
});
