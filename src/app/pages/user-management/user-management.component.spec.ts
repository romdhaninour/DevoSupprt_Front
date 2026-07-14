/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { UserManagementComponent } from './user-management.component';
import { ApiService } from '../../services/api.service';
import { of, throwError } from 'rxjs';
import { User } from '../../models/user.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUsers: User[] = [
    {
      _id: '1',
      nom: 'Doe',
      prenom: 'John',
      email: 'john@example.com',
      role: 'ADMIN',
      status: 'active',
      isConsultant: false,
      profilePicture: 'https://example.com/pic.jpg',
    },
    {
      _id: '2',
      nom: 'Smith',
      prenom: 'Jane',
      email: 'jane@example.com',
      role: 'IT',
      status: 'inactive',
      isConsultant: true,
      profilePicture: 'https://example.com/pic2.jpg',
    },
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUsers',
      'activateUser',
      'deactivateUser',
      'archiveUser',
      'deleteUser',
      'createUser',
      'updateUser',
    ]);

    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load users on initialization', () => {
      apiServiceSpy.getUsers.and.returnValue(of(mockUsers));
      fixture.detectChanges();

      expect(apiServiceSpy.getUsers).toHaveBeenCalled();
    });
  });

  describe('loadUsers', () => {
    it('should load users successfully', () => {
      apiServiceSpy.getUsers.and.returnValue(of(mockUsers));
      component.loadUsers();

      expect(component.users()).toEqual(mockUsers);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should handle error when loading users', () => {
      apiServiceSpy.getUsers.and.returnValue(throwError(() => new Error('Error')));
      component.loadUsers();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Failed to load users');
    });
  });

  describe('filteredUsers computed', () => {
    beforeEach(() => {
      component.users.set(mockUsers);
    });

    it('should return all users when no filters applied', () => {
      component.searchTerm.set('');
      component.roleFilter.set('all');
      component.statusFilter.set('all');

      expect(component.filteredUsers().length).toBe(2);
    });

    it('should filter by search term', () => {
      component.searchTerm.set('john');
      component.roleFilter.set('all');
      component.statusFilter.set('all');

      const filtered = component.filteredUsers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].prenom).toBe('John');
    });

    it('should filter by role', () => {
      component.searchTerm.set('');
      component.roleFilter.set('ADMIN');
      component.statusFilter.set('all');

      const filtered = component.filteredUsers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].role).toBe('ADMIN');
    });

    it('should filter by status', () => {
      component.searchTerm.set('');
      component.roleFilter.set('all');
      component.statusFilter.set('active');

      const filtered = component.filteredUsers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('active');
    });

    it('should combine multiple filters', () => {
      component.searchTerm.set('john');
      component.roleFilter.set('ADMIN');
      component.statusFilter.set('active');

      const filtered = component.filteredUsers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].prenom).toBe('John');
      expect(filtered[0].role).toBe('ADMIN');
      expect(filtered[0].status).toBe('active');
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      component.users.set(mockUsers);
      component.searchTerm.set('');
      component.roleFilter.set('all');
      component.statusFilter.set('all');
    });

    it('should calculate total pages correctly', () => {
      expect(component.totalPages).toBe(1);
    });

    it('should return paginated users', () => {
      const paginated = component.paginatedUsers;
      expect(paginated.length).toBe(2);
    });

    it('should navigate to page', () => {
      component.goToPage(1);
      expect(component.currentPage).toBe(1);
    });

    it('should not navigate to invalid page', () => {
      component.goToPage(10);
      expect(component.currentPage).toBe(1);
    });

    it('should reset pagination when search term changes', () => {
      component.currentPage = 2;
      component.updateSearchTerm('test');
      expect(component.currentPage).toBe(1);
    });

    it('should reset pagination when role filter changes', () => {
      component.currentPage = 2;
      component.updateRoleFilter('ADMIN');
      expect(component.currentPage).toBe(1);
    });

    it('should reset pagination when status filter changes', () => {
      component.currentPage = 2;
      component.updateStatusFilter('active');
      expect(component.currentPage).toBe(1);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display name for ADMIN', () => {
      expect(component.getRoleDisplayName('ADMIN')).toBe('Admin');
    });

    it('should return correct display name for IT', () => {
      expect(component.getRoleDisplayName('IT')).toBe('IT');
    });

    it('should return correct display name for CONSULTANT', () => {
      expect(component.getRoleDisplayName('CONSULTANT')).toBe('Consultant');
    });

    it('should return Inconnu for unknown role', () => {
      expect(component.getRoleDisplayName('UNKNOWN')).toBe('Inconnu');
    });
  });

  describe('getRoleBadgeColor', () => {
    it('should return correct color for ADMIN', () => {
      const color = component.getRoleBadgeColor('ADMIN');
      expect(color).toContain('rose');
    });

    it('should return correct color for CONSULTANT', () => {
      const color = component.getRoleBadgeColor('CONSULTANT');
      expect(color).toContain('cyan');
    });

    it('should return correct color for IT', () => {
      const color = component.getRoleBadgeColor('IT');
      expect(color).toContain('amber');
    });

    it('should return default color for unknown role', () => {
      const color = component.getRoleBadgeColor('UNKNOWN');
      expect(color).toContain('gray');
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', () => {
      apiServiceSpy.activateUser.and.returnValue(of(mockUsers[0]));
      component.users.set(mockUsers);
      spyOn(component, 'loadUsers');

      component.activateUser('1');

      expect(apiServiceSpy.activateUser).toHaveBeenCalledWith('1');
      expect(component.loadUsers).toHaveBeenCalled();
    });

    it('should handle activation error', () => {
      apiServiceSpy.activateUser.and.returnValue(throwError(() => new Error('Error')));
      component.activateUser('1');

      expect(component.error()).toBe('Failed to activate user');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', () => {
      apiServiceSpy.deactivateUser.and.returnValue(of(mockUsers[0]));
      component.users.set(mockUsers);
      spyOn(component, 'loadUsers');

      component.deactivateUser('1');

      expect(apiServiceSpy.deactivateUser).toHaveBeenCalledWith('1');
      expect(component.loadUsers).toHaveBeenCalled();
    });

    it('should handle deactivation error', () => {
      apiServiceSpy.deactivateUser.and.returnValue(throwError(() => new Error('Error')));
      component.deactivateUser('1');

      expect(component.error()).toBe('Failed to deactivate user');
    });
  });

  describe('openActivateModal', () => {
    it('should open activate modal and set selected user', () => {
      component.openActivateModal(mockUsers[0]);

      expect(component.selectedUser()).toEqual(mockUsers[0]);
      expect(component.activationModalOpen()).toBe(true);
      expect(component.openActionMenuId()).toBeNull();
    });
  });

  describe('openDeactivateModal', () => {
    it('should open deactivate modal and set selected user', () => {
      component.openDeactivateModal(mockUsers[0]);

      expect(component.selectedUser()).toEqual(mockUsers[0]);
      expect(component.deactivationModalOpen()).toBe(true);
      expect(component.openActionMenuId()).toBeNull();
    });
  });

  describe('confirmActivate', () => {
    it('should activate user and close modal', () => {
      component.selectedUser.set(mockUsers[0]);
      component.activationModalOpen.set(true);
      spyOn(component, 'activateUser');

      component.confirmActivate();

      expect(component.activateUser).toHaveBeenCalledWith(mockUsers[0]._id);
      expect(component.activationModalOpen()).toBe(false);
      expect(component.selectedUser()).toBeNull();
    });
  });

  describe('confirmDeactivate', () => {
    it('should deactivate user and close modal', () => {
      component.selectedUser.set(mockUsers[0]);
      component.deactivationModalOpen.set(true);
      spyOn(component, 'deactivateUser');

      component.confirmDeactivate();

      expect(component.deactivateUser).toHaveBeenCalledWith(mockUsers[0]._id);
      expect(component.deactivationModalOpen()).toBe(false);
      expect(component.selectedUser()).toBeNull();
    });
  });

  describe('openArchiveModal', () => {
    it('should show warning modal for active user', () => {
      const activeUser = { ...mockUsers[0], status: 'active' as const };
      component.openArchiveModal(activeUser);

      expect(component.selectedUser()).toEqual(activeUser);
      expect(component.archiveModalOpen()).toBe(true);
      expect(component.openActionMenuId()).toBeNull();
    });

    it('should show archive modal for inactive user', () => {
      const inactiveUser = { ...mockUsers[1], status: 'inactive' as const };
      component.openArchiveModal(inactiveUser);

      expect(component.selectedUser()).toEqual(inactiveUser);
      expect(component.archiveModalOpen()).toBe(true);
      expect(component.archiveModalOpen()).toBe(false);
      expect(component.openActionMenuId()).toBeNull();
    });
  });

  describe('resetNewUserForm', () => {
    it('should reset new user form fields', () => {
      component.newUserNom = 'Test';
      component.newUserPrenom = 'Test';
      component.newUserEmail = 'test@example.com';
      component.newUserRole = 'ADMIN';
      component.newUserError.set('Error');

      component.resetNewUserForm();

      expect(component.newUserNom).toBe('');
      expect(component.newUserPrenom).toBe('');
      expect(component.newUserEmail).toBe('');
      expect(component.newUserRole).toBe('IT');
      expect(component.newUserError()).toBeNull();
    });
  });

  describe('openAddUserModal', () => {
    it('should open add user modal and reset form', () => {
      component.newUserNom = 'Test';
      spyOn(component, 'resetNewUserForm');

      component.openAddUserModal();

      expect(component.addUserModalOpen()).toBe(true);
      expect(component.openActionMenuId()).toBeNull();
      expect(component.resetNewUserForm).toHaveBeenCalled();
    });
  });

  describe('confirmAddUser', () => {
    beforeEach(() => {
      component.newUserNom = 'John';
      component.newUserPrenom = 'Doe';
      component.newUserEmail = 'john@example.com';
      component.newUserRole = 'IT';
      localStorage.setItem('auth_token', 'test-token');
    });

    it('should create user successfully', () => {
      apiServiceSpy.createUser.and.returnValue(of(mockUsers[0]));
      spyOn(component, 'loadUsers');

      component.confirmAddUser();

      expect(apiServiceSpy.createUser).toHaveBeenCalledWith({
        nom: 'John',
        prenom: 'Doe',
        email: 'john@example.com',
        role: 'IT',
      });
      expect(component.loadUsers).toHaveBeenCalled();
      expect(component.addUserModalOpen()).toBe(false);
    });

    it('should show error when fields are empty', () => {
      component.newUserNom = '';
      component.newUserPrenom = '';
      component.newUserEmail = '';

      component.confirmAddUser();

      expect(component.newUserError()).toBe('Veuillez remplir tous les champs obligatoires.');
      expect(apiServiceSpy.createUser).not.toHaveBeenCalled();
    });

    it('should show error for invalid email', () => {
      component.newUserEmail = 'invalid-email';

      component.confirmAddUser();

      expect(component.newUserError()).toBe('Veuillez saisir une adresse email valide.');
      expect(apiServiceSpy.createUser).not.toHaveBeenCalled();
    });

    it('should show error when no token', () => {
      localStorage.removeItem('auth_token');

      component.confirmAddUser();

      expect(component.newUserError()).toBe('Vous devez être connecté pour ajouter un utilisateur.');
      expect(apiServiceSpy.createUser).not.toHaveBeenCalled();
    });

    it('should handle 401 error', () => {
      const error401 = { status: 401 };
      apiServiceSpy.createUser.and.returnValue(throwError(() => error401));

      component.confirmAddUser();

      expect(component.newUserError()).toBe('Session expirée ou non autorisée. Veuillez vous reconnecter.');
    });

    it('should handle 403 error', () => {
      const error403 = { status: 403 };
      apiServiceSpy.createUser.and.returnValue(throwError(() => error403));

      component.confirmAddUser();

      expect(component.newUserError()).toBe('Vous devez être administrateur pour ajouter un utilisateur.');
    });

    afterEach(() => {
      localStorage.removeItem('auth_token');
    });
  });

  describe('confirmArchive', () => {
    it('should archive user and close modal', () => {
      component.selectedUser.set(mockUsers[0]);
      component.archiveModalOpen.set(true);
      apiServiceSpy.archiveUser.and.returnValue(of(mockUsers[0]));
      spyOn(component, 'loadUsers');

      component.confirmArchive();

      expect(apiServiceSpy.archiveUser).toHaveBeenCalledWith(mockUsers[0]._id);
      expect(component.loadUsers).toHaveBeenCalled();
      expect(component.archiveModalOpen()).toBe(false);
      expect(component.selectedUser()).toBeNull();
    });

    it('should handle archive error', () => {
      component.selectedUser.set(mockUsers[0]);
      apiServiceSpy.archiveUser.and.returnValue(throwError(() => new Error('Error')));

      component.confirmArchive();

      expect(component.error()).toBe('Failed to archive user');
    });
  });

  describe('openDeleteModal', () => {
    it('should open delete modal and set selected user', () => {
      component.openDeleteModal(mockUsers[0]);

      expect(component.selectedUser()).toEqual(mockUsers[0]);
      expect(component.deleteModalOpen()).toBe(true);
    });
  });

  describe('confirmDelete', () => {
    it('should delete user and close modal', () => {
      component.selectedUser.set(mockUsers[0]);
      component.deleteModalOpen.set(true);
      apiServiceSpy.deleteUser.and.returnValue(of({ message: 'Deleted' }));
      spyOn(component, 'loadUsers');

      component.confirmDelete();

      expect(apiServiceSpy.deleteUser).toHaveBeenCalledWith(mockUsers[0]._id);
      expect(component.loadUsers).toHaveBeenCalled();
      expect(component.deleteModalOpen()).toBe(false);
      expect(component.selectedUser()).toBeNull();
    });

    it('should handle delete error', () => {
      component.selectedUser.set(mockUsers[0]);
      apiServiceSpy.deleteUser.and.returnValue(throwError(() => new Error('Error')));

      component.confirmDelete();

      expect(component.error()).toBe('Failed to delete user');
    });
  });

  describe('closeModals', () => {
    it('should close all modals and reset state', () => {
      component.addUserModalOpen.update(v => true);
      component.archiveModalOpen.update(v => true);
      component.deleteModalOpen.update(v => true);
      component.selectedUser.set(mockUsers[0]);
      component.openActionMenuId.set('1');

      component.closeModals();

      expect(component.addUserModalOpen()).toBe(false);
      expect(component.archiveModalOpen()).toBe(false);
      expect(component.deleteModalOpen()).toBe(false);
      expect(component.selectedUser()).toBeNull();
      expect(component.openActionMenuId()).toBeNull();
    });
  });

  describe('toggleActionMenu', () => {
    it('should open action menu', () => {
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'currentTarget', {
        value: document.createElement('div'),
        writable: false,
      });

      component.toggleActionMenu('1', event);

      expect(component.openActionMenuId()).toBe('1');
    });

    it('should close action menu if already open', () => {
      component.openActionMenuId.set('1');
      const event = new MouseEvent('click');

      component.toggleActionMenu('1', event);

      expect(component.openActionMenuId()).toBeNull();
    });
  });

  describe('openEditModal', () => {
    it('should open edit modal and set selected user', () => {
      component.openEditModal(mockUsers[0]);

      expect(component.selectedUser()).toEqual(mockUsers[0]);
      expect(component.selectedRole()).toBe(mockUsers[0].role);
      expect(component.editModalOpen()).toBe(true);
      expect(component.openActionMenuId()).toBeNull();
    });
  });

  describe('confirmEdit', () => {
    it('should update user role and close modal', () => {
      component.selectedUser.set(mockUsers[0]);
      component.selectedRole.set('IT');
      component.editModalOpen.set(true);
      apiServiceSpy.updateUser.and.returnValue(of(mockUsers[0]));
      spyOn(component, 'loadUsers');

      component.confirmEdit();

      expect(apiServiceSpy.updateUser).toHaveBeenCalledWith(mockUsers[0]._id, { role: 'IT' });
      expect(component.loadUsers).toHaveBeenCalled();
      expect(component.editModalOpen()).toBe(false);
      expect(component.selectedUser()).toBeNull();
      expect(component.selectedRole()).toBe('');
    });

    it('should handle update error', () => {
      component.selectedUser.set(mockUsers[0]);
      component.selectedRole.set('IT');
      apiServiceSpy.updateUser.and.returnValue(throwError(() => new Error('Error')));

      component.confirmEdit();

      expect(component.error()).toBe('Failed to update user role');
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for active status', () => {
      expect(component.getStatusClass('active')).toBe('bg-green-100 text-green-800');
    });

    it('should return correct class for inactive status', () => {
      expect(component.getStatusClass('inactive')).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return default class for unknown status', () => {
      expect(component.getStatusClass('unknown')).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('pageNumbers', () => {
    it('should return array of page numbers', () => {
      component.users.set(mockUsers);
      const pages = component.pageNumbers();
      expect(pages).toEqual([1]);
    });
  });
});
