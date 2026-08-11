import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TicketsComponent } from './tickets.component';
import { ApiService } from '../../services/api.service';
import { TicketStatus, TicketPriority, IssueType, ResolutionType } from '../../models/ticket.model';
import { User } from '../../models/user.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';

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
      'getDevices',
      'getAssignedDevices',
    ]);

    const mockActivatedRoute = {
      url: of([]),
      queryParams: of({}),
    };

    await TestBed.configureTestingModule({
      imports: [TicketsComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TicketsComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    localStorage.setItem('user_role', 'ADMIN');
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  afterEach(() => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('user');
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
      
      component.userRole.set('ADMIN');
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
      
      expect(apiServiceSpy.getTickets).toHaveBeenCalledWith('OPEN', 'HIGH', undefined, undefined, undefined, false, 'desc');
    });
  });

  describe('openCreateModal', () => {
    it('should open create modal and reset form', () => {
      apiServiceSpy.getAssignedDevices.and.returnValue(of({ devices: [], total: 0, page: 1, limit: 1000 }));

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
    it('should create a ticket successfully', async () => {
      apiServiceSpy.createTicket.and.returnValue(of(mockTicket));
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [mockTicket], total: 1 }));
      
      component.createForm.set({
        title: 'New Ticket',
        description: 'Description',
        deviceId: 'device1',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      
      await component.createTicket();
      
      expect(apiServiceSpy.createTicket).toHaveBeenCalled();
      expect(component.showCreateModal()).toBe(false);
    });

    it('should not create ticket if form is invalid', async () => {
      component.createForm.set({
        title: '',
        description: '',
        deviceId: '',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      
      await component.createTicket();
      
      expect(apiServiceSpy.createTicket).not.toHaveBeenCalled();
    });

    it('should handle errors when creating ticket', async () => {
      apiServiceSpy.createTicket.and.returnValue(throwError(() => new Error('Error')));
      
      component.createForm.set({
        title: 'Test',
        description: 'Test',
        deviceId: 'device1',
        issueType: IssueType.DAMAGED,
        priority: TicketPriority.MEDIUM,
      });
      
      await component.createTicket();
      
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
    it('should update ticket status', async () => {
      const updatedTicket = { ...mockTicket, status: TicketStatus.IN_PROGRESS };
      apiServiceSpy.updateTicketStatus.and.returnValue(of(updatedTicket));
      
      component.selectedTicket.set(mockTicket);
      await component.updateTicketStatus(TicketStatus.IN_PROGRESS);
      
      expect(apiServiceSpy.updateTicketStatus).toHaveBeenCalledWith(
        mockTicket._id,
        { status: TicketStatus.IN_PROGRESS }
      );
      expect(component.selectedTicket()).toEqual(updatedTicket);
    });

    it('should update ticket status with resolution', async () => {
      const updatedTicket = { ...mockTicket, status: TicketStatus.RESOLVED, resolution: ResolutionType.REPAIR };
      apiServiceSpy.updateTicketStatus.and.returnValue(of(updatedTicket));
      
      component.selectedTicket.set(mockTicket);
      await component.updateTicketStatus(TicketStatus.RESOLVED, ResolutionType.REPAIR);
      
      expect(apiServiceSpy.updateTicketStatus).toHaveBeenCalledWith(
        mockTicket._id,
        { status: TicketStatus.RESOLVED, resolution: ResolutionType.REPAIR }
      );
    });

    it('should handle errors when updating status', async () => {
      apiServiceSpy.updateTicketStatus.and.returnValue(throwError(() => new Error('Error')));
      
      component.selectedTicket.set(mockTicket);
      await component.updateTicketStatus(TicketStatus.IN_PROGRESS);
      
      expect(component.error()).toBe('Failed to update ticket status');
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to user', async () => {
      const assignedTicket = { ...mockTicket, assignedTo: mockITStaff[0] };
      apiServiceSpy.assignTicket.and.returnValue(of(assignedTicket));
      
      component.selectedTicket.set(mockTicket);
      await component.assignTicket(mockITStaff[0]._id);
      
      expect(apiServiceSpy.assignTicket).toHaveBeenCalledWith(
        mockTicket._id,
        { assignedTo: mockITStaff[0]._id }
      );
      expect(component.selectedTicket()).toEqual(assignedTicket);
    });

    it('should handle errors when assigning ticket', async () => {
      apiServiceSpy.assignTicket.and.returnValue(throwError(() => new Error('Error')));
      
      component.selectedTicket.set(mockTicket);
      await component.assignTicket(mockITStaff[0]._id);
      
      expect(component.error()).toBe('Failed to assign ticket');
    });
  });

  describe('addComment', () => {
    it('should add comment to ticket', async () => {
      const ticketWithComment = {
        ...mockTicket,
        comments: [{ author: mockUser, text: 'Test comment', createdAt: new Date().toISOString() }]
      };
      apiServiceSpy.addTicketComment.and.returnValue(of(ticketWithComment));
      
      component.selectedTicket.set(mockTicket);
      component.newComment.set('Test comment');
      
      await component.addComment();
      
      expect(apiServiceSpy.addTicketComment).toHaveBeenCalledWith(
        mockTicket._id,
        { text: 'Test comment' }
      );
      expect(component.newComment()).toBe('');
    });

    it('should not add empty comment', async () => {
      component.selectedTicket.set(mockTicket);
      component.newComment.set('');
      
      await component.addComment();
      
      expect(apiServiceSpy.addTicketComment).not.toHaveBeenCalled();
    });

    it('should handle errors when adding comment', async () => {
      apiServiceSpy.addTicketComment.and.returnValue(throwError(() => new Error('Error')));
      
      component.selectedTicket.set(mockTicket);
      component.newComment.set('Test comment');
      
      await component.addComment();
      
      expect(component.error()).toBe('Failed to add comment');
    });
  });

  describe('deleteTicket', () => {
    it('should delete ticket and close modal', async () => {
      apiServiceSpy.deleteTicket.and.returnValue(of({ message: 'Ticket deleted successfully' }));
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [], total: 0 }));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.selectedTicket.set(mockTicket);
      await component.deleteTicket();
      
      expect(apiServiceSpy.deleteTicket).toHaveBeenCalledWith(mockTicket._id);
      expect(component.showDetailModal()).toBe(false);
    });

    it('should not delete ticket if user cancels confirmation', async () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.selectedTicket.set(mockTicket);
      await component.deleteTicket();
      
      expect(apiServiceSpy.deleteTicket).not.toHaveBeenCalled();
    });

    it('should handle errors when deleting ticket', async () => {
      apiServiceSpy.deleteTicket.and.returnValue(throwError(() => new Error('Error')));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.selectedTicket.set(mockTicket);
      await component.deleteTicket();
      
      expect(component.error()).toBe('Failed to delete ticket');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct French labels', () => {
      expect(component.getStatusLabel(TicketStatus.OPEN)).toBe('Nouveau');
      expect(component.getStatusLabel(TicketStatus.IN_PROGRESS)).toBe('En cours');
      expect(component.getStatusLabel(TicketStatus.RESOLVED)).toBe('Résolu');
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
      localStorage.removeItem('user');
      expect(component.getCurrentUserInitials()).toBe('?');
    });
  });

  describe('isIT', () => {
    it('should return true for IT role', () => {
      component.userRole.set('IT');
      expect(component.isIT()).toBe(true);
    });

    it('should return true for ADMIN role', () => {
      component.userRole.set('ADMIN');
      expect(component.isIT()).toBe(true);
    });

    it('should return false for CONSULTANT role', () => {
      component.userRole.set('CONSULTANT');
      expect(component.isIT()).toBe(false);
    });
  });

  describe('getStatusClass', () => {
    it('should return correct CSS classes for each status', () => {
      expect(component.getStatusClass(TicketStatus.OPEN)).toContain('bg-emerald');
      expect(component.getStatusClass(TicketStatus.IN_PROGRESS)).toContain('bg-sky');
      expect(component.getStatusClass(TicketStatus.RESOLVED)).toContain('bg-violet');
    });
  });

  describe('getPriorityClass', () => {
    it('should return correct CSS classes for each priority', () => {
      expect(component.getPriorityClass(TicketPriority.LOW)).toContain('bg-blue');
      expect(component.getPriorityClass(TicketPriority.MEDIUM)).toContain('bg-amber');
      expect(component.getPriorityClass(TicketPriority.HIGH)).toContain('bg-orange');
      expect(component.getPriorityClass(TicketPriority.URGENT)).toContain('bg-rose');
    });

    it('should return default class for unknown priority', () => {
      expect(component.getPriorityClass('unknown' as any)).toContain('bg-gray');
    });
  });

  describe('getStatusClass default', () => {
    it('should return default class for unknown status', () => {
      expect(component.getStatusClass('unknown' as any)).toContain('bg-gray');
    });
  });

  describe('getResolutionLabel', () => {
    it('should return empty string for undefined resolution', () => {
      expect(component.getResolutionLabel(undefined)).toBe('');
    });
  });

  describe('getStatusLabel', () => {
    it('should return raw status for unknown status', () => {
      expect(component.getStatusLabel('unknown' as any)).toBe('unknown');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return raw priority for unknown priority', () => {
      expect(component.getPriorityLabel('unknown' as any)).toBe('unknown');
    });
  });

  describe('openTicketDetail', () => {
    it('should navigate to the ticket detail route', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');
      component.openTicketDetail(mockTicket);
      expect(navigateSpy).toHaveBeenCalledWith(['/tickets', mockTicket._id]);
    });
  });

  describe('onFilterChange', () => {
    it('should reset page to 1 and reload tickets', () => {
      component.currentPage.set(5);
      apiServiceSpy.getTickets.and.returnValue(of({ tickets: [], total: 0 }));

      component.onFilterChange();

      expect(component.currentPage()).toBe(1);
    });
  });

  describe('goToPage', () => {
    it('should navigate to valid page', () => {
      component.tickets.set(Array.from({ length: 25 }, (_, i) => ({ ...mockTicket, _id: `t${i}` })));
      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
    });

    it('should not navigate to invalid page', () => {
      component.currentPage.set(1);
      component.goToPage(0);
      expect(component.currentPage()).toBe(1);
    });

    it('should not navigate beyond total pages', () => {
      component.tickets.set([{ ...mockTicket }]);
      component.currentPage.set(1);
      component.goToPage(100);
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('getDisplayRangeEnd', () => {
    it('should return correct display range end', () => {
      component.tickets.set(Array.from({ length: 25 }, (_, i) => ({ ...mockTicket, _id: `t${i}` })));
      component.currentPage.set(2);
      expect(component.getDisplayRangeEnd()).toBe(20);
    });
  });

  describe('formatDate', () => {
    it('should format date to French locale', () => {
      const result = component.formatDate('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
    });
  });

  describe('computed values', () => {
    it('should compute open tickets count', () => {
      component.tickets.set([
        { ...mockTicket, status: TicketStatus.OPEN, _id: '1' },
        { ...mockTicket, status: TicketStatus.OPEN, _id: '2' },
        { ...mockTicket, status: TicketStatus.RESOLVED, _id: '3' },
      ]);
      expect(component.openTickets()).toBe(2);
    });

    it('should compute in progress tickets count', () => {
      component.tickets.set([
        { ...mockTicket, status: TicketStatus.IN_PROGRESS, _id: '1' },
        { ...mockTicket, status: TicketStatus.OPEN, _id: '2' },
      ]);
      expect(component.inProgressTickets()).toBe(1);
    });

    it('should compute resolved tickets count', () => {
      component.tickets.set([
        { ...mockTicket, status: TicketStatus.RESOLVED, _id: '1' },
        { ...mockTicket, status: TicketStatus.OPEN, _id: '2' },
      ]);
      expect(component.resolvedTickets()).toBe(1);
    });

    it('should compute urgent tickets count', () => {
      component.tickets.set([
        { ...mockTicket, status: TicketStatus.OPEN, priority: TicketPriority.URGENT, _id: '1' },
        { ...mockTicket, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, _id: '2' },
        { ...mockTicket, status: TicketStatus.OPEN, priority: TicketPriority.HIGH, _id: '3' },
      ]);
      expect(component.urgentTickets()).toBe(1);
    });

    it('should compute totalPages', () => {
      component.tickets.set(Array.from({ length: 25 }, (_, i) => ({ ...mockTicket, _id: `t${i}` })));
      expect(component.totalPages()).toBe(3);
    });

    it('should compute paginatedTickets', () => {
      component.tickets.set(Array.from({ length: 15 }, (_, i) => ({ ...mockTicket, _id: `t${i}` })));
      expect(component.paginatedTickets().length).toBe(10);
    });
  });

  describe('loadDevices', () => {
    it('should load all devices for IT users', () => {
      component.userRole.set('IT');
      apiServiceSpy.getDevices.and.returnValue(of({ devices: [{ _id: 'd1', name: 'L1', type: 'Laptop' }], total: 1, page: 1, limit: 1000 }));
      apiServiceSpy.getUsers.and.returnValue(of([]));

      component.loadDevices().subscribe();

      expect(apiServiceSpy.getDevices).toHaveBeenCalled();
      expect(component.devices().length).toBe(1);
    });

    it('should load assigned devices for consultants', () => {
      component.userRole.set('CONSULTANT');
      apiServiceSpy.getAssignedDevices.and.returnValue(of({ devices: [{ _id: 'd1', name: 'L1', type: 'Laptop' }], total: 1, page: 1, limit: 1000 }));

      component.loadDevices().subscribe();

      expect(apiServiceSpy.getAssignedDevices).toHaveBeenCalled();
    });

    it('should handle device load error for IT', () => {
      component.userRole.set('IT');
      apiServiceSpy.getDevices.and.returnValue(throwError(() => new Error('fail')));

      component.loadDevices().subscribe();

      expect(component.devices()).toEqual([]);
    });

    it('should handle device load error for consultant', () => {
      component.userRole.set('CONSULTANT');
      apiServiceSpy.getAssignedDevices.and.returnValue(throwError(() => new Error('fail')));

      component.loadDevices().subscribe();

      expect(component.devices()).toEqual([]);
    });
  });

  describe('loadITStaff', () => {
    it('should load IT staff filtered', () => {
      apiServiceSpy.getUsers.and.returnValue(of(mockITStaff as any));

      component.loadITStaff();

      expect(component.itStaff().length).toBe(2);
    });

    it('should handle load error', () => {
      apiServiceSpy.getUsers.and.returnValue(throwError(() => new Error('fail')));

      component.loadITStaff();

      expect(component.itStaff()).toEqual([]);
    });
  });

  describe('viewMode computed', () => {
    it('should compute isMyTicketsView', () => {
      component.viewMode.set('mine');
      expect(component.isMyTicketsView()).toBe(true);

      component.viewMode.set('all');
      expect(component.isMyTicketsView()).toBe(false);
    });
  });

  describe('getCurrentUserInitials invalid JSON', () => {
    it('should return ? for invalid JSON', () => {
      localStorage.setItem('user', '{invalid json');
      expect(component.getCurrentUserInitials()).toBe('?');
    });
  });
});
