import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ArchivedUsersComponent } from './archived-users.component';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';
import { provideRouter } from '@angular/router';

describe('ArchivedUsersComponent', () => {
  let component: ArchivedUsersComponent;
  let fixture: ComponentFixture<ArchivedUsersComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockUsers: User[] = [
    {
      _id: '1',
      nom: 'Doe',
      prenom: 'John',
      email: 'john@example.com',
      role: 'ADMIN',
      status: 'archived',
      isConsultant: false,
      profilePicture: 'https://example.com/pic.jpg',
    },
    {
      _id: '2',
      nom: 'Smith',
      prenom: 'Jane',
      email: 'jane@example.com',
      role: 'IT',
      status: 'archived',
      isConsultant: false,
      profilePicture: 'https://example.com/pic2.jpg',
    },
    {
      _id: '3',
      nom: 'Brown',
      prenom: 'Bob',
      email: 'bob@example.com',
      role: 'CONSULTANT',
      status: 'archived',
      isConsultant: true,
      profilePicture: '',
    },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getArchivedUsers',
      'restoreUser',
      'deleteUser',
    ]);
    spy.getArchivedUsers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ArchivedUsersComponent],
      providers: [{ provide: ApiService, useValue: spy }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivedUsersComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize signals with default values', () => {
    expect(component.users()).toEqual([]);
    expect(component.loading()).toBe(true);
    expect(component.error()).toBeNull();
    expect(component.searchTerm()).toBe('');
    expect(component.roleFilter()).toBe('all');
    expect(component.deleteModalOpen()).toBe(false);
    expect(component.restoreModalOpen()).toBe(false);
    expect(component.selectedUser()).toBeNull();
    expect(component.openActionMenuId()).toBeNull();
    expect(component.actionMenuPosition()).toBeNull();
  });

  it('should have default pagination values', () => {
    expect(component.currentPage).toBe(1);
    expect(component.itemsPerPage).toBe(6);
  });

  it('should load archived users on init', () => {
    apiService.getArchivedUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.users().length).toBe(3);
    expect(component.loading()).toBe(false);
  });

  it('should set error on load failure', () => {
    apiService.getArchivedUsers.and.returnValue(
      throwError(() => new Error('fail'))
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load archived users');
    expect(component.loading()).toBe(false);
  });

  it('should return correct role badge color for ADMIN', () => {
    expect(component.getRoleBadgeColor('ADMIN')).toContain('rose');
  });

  it('should return correct role badge color for CONSULTANT', () => {
    expect(component.getRoleBadgeColor('CONSULTANT')).toContain('cyan');
  });

  it('should return correct role badge color for IT', () => {
    expect(component.getRoleBadgeColor('IT')).toContain('amber');
  });

  it('should return default color for unknown role', () => {
    expect(component.getRoleBadgeColor('UNKNOWN')).toContain('gray');
  });

  it('should calculate total pages correctly', () => {
    component.users.set(mockUsers);
    component.itemsPerPage = 1;
    expect(component.totalPages).toBe(3);
  });

  it('should return paginated users', () => {
    component.users.set(mockUsers);
    component.itemsPerPage = 2;
    component.currentPage = 1;
    expect(component.paginatedUsers.length).toBe(2);
  });

  it('should return second page of paginated users', () => {
    component.users.set(mockUsers);
    component.itemsPerPage = 2;
    component.currentPage = 2;
    expect(component.paginatedUsers.length).toBe(1);
    expect(component.paginatedUsers[0]._id).toBe('3');
  });

  it('should go to valid page', () => {
    component.users.set(mockUsers);
    component.itemsPerPage = 1;
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
  });

  it('should not go to invalid page beyond total', () => {
    component.users.set(mockUsers);
    component.itemsPerPage = 1;
    component.goToPage(1);
    component.goToPage(999);
    expect(component.currentPage).toBe(1);
  });

  it('should not go to page 0', () => {
    component.users.set(mockUsers);
    component.itemsPerPage = 1;
    component.goToPage(0);
    expect(component.currentPage).toBe(1);
  });

  it('should filter users by search term', () => {
    component.users.set(mockUsers);

    component.updateSearchTerm('John');

    expect(component.searchTerm()).toBe('John');
    expect(component.currentPage).toBe(1);
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].prenom).toBe('John');
  });

  it('should filter users by search term on nom', () => {
    component.users.set(mockUsers);

    component.updateSearchTerm('Smith');

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].nom).toBe('Smith');
  });

  it('should filter users by search term on email', () => {
    component.users.set(mockUsers);

    component.updateSearchTerm('bob@example');

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].prenom).toBe('Bob');
  });

  it('should be case-insensitive in search', () => {
    component.users.set(mockUsers);

    component.updateSearchTerm('john');

    expect(component.filteredUsers().length).toBe(1);
  });

  it('should update role filter and reset page', () => {
    component.users.set(mockUsers);
    component.currentPage = 3;

    component.updateRoleFilter('ADMIN');

    expect(component.roleFilter()).toBe('ADMIN');
    expect(component.currentPage).toBe(1);
  });

  it('should filter users by role', () => {
    component.users.set(mockUsers);

    component.updateRoleFilter('IT');

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].role).toBe('IT');
  });

  it('should return all users when role filter is all', () => {
    component.users.set(mockUsers);

    component.updateRoleFilter('all');

    expect(component.filteredUsers().length).toBe(3);
  });

  it('should combine search and role filters', () => {
    component.users.set(mockUsers);

    component.updateSearchTerm('John');
    component.updateRoleFilter('ADMIN');

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].prenom).toBe('John');
  });

  it('should restore user', () => {
    apiService.restoreUser.and.returnValue(of({} as any));
    apiService.getArchivedUsers.and.returnValue(of([]));

    component.restoreUser('user1');

    expect(apiService.restoreUser).toHaveBeenCalledWith('user1');
  });

  it('should set error on restore failure', () => {
    apiService.restoreUser.and.returnValue(
      throwError(() => new Error('fail'))
    );

    component.restoreUser('user1');

    expect(component.error()).toBe('Failed to restore user');
  });

  it('should open restore modal', () => {
    component.openRestoreModal(mockUsers[0]);

    expect(component.restoreModalOpen()).toBe(true);
    expect(component.selectedUser()).toEqual(mockUsers[0]);
    expect(component.openActionMenuId()).toBeNull();
  });

  it('should confirm restore and call API', () => {
    apiService.restoreUser.and.returnValue(of({} as any));
    apiService.getArchivedUsers.and.returnValue(of([]));
    component.selectedUser.set(mockUsers[0]);

    component.confirmRestore();

    expect(apiService.restoreUser).toHaveBeenCalledWith('1');
    expect(component.restoreModalOpen()).toBe(false);
    expect(component.selectedUser()).toBeNull();
  });

  it('should not restore if no user selected', () => {
    component.selectedUser.set(null);

    component.confirmRestore();

    expect(apiService.restoreUser).not.toHaveBeenCalled();
  });

  it('should open delete modal', () => {
    component.openDeleteModal(mockUsers[0]);

    expect(component.deleteModalOpen()).toBe(true);
    expect(component.selectedUser()).toEqual(mockUsers[0]);
    expect(component.openActionMenuId()).toBeNull();
  });

  it('should confirm delete and call API', () => {
    apiService.deleteUser.and.returnValue(of({ message: 'deleted' }));
    apiService.getArchivedUsers.and.returnValue(of([]));
    component.selectedUser.set(mockUsers[0]);

    component.confirmDelete();

    expect(apiService.deleteUser).toHaveBeenCalledWith('1');
  });

  it('should set error on delete failure', () => {
    apiService.deleteUser.and.returnValue(
      throwError(() => new Error('fail'))
    );
    component.selectedUser.set(mockUsers[0]);

    component.confirmDelete();

    expect(component.error()).toBe('Failed to delete user');
  });

  it('should not delete if no user selected', () => {
    component.selectedUser.set(null);

    component.confirmDelete();

    expect(apiService.deleteUser).not.toHaveBeenCalled();
  });

  it('should close all modals', () => {
    component.deleteModalOpen.set(true);
    component.restoreModalOpen.set(true);
    component.selectedUser.set(mockUsers[0]);
    component.openActionMenuId.set('user1');

    component.closeModals();

    expect(component.deleteModalOpen()).toBe(false);
    expect(component.restoreModalOpen()).toBe(false);
    expect(component.selectedUser()).toBeNull();
    expect(component.openActionMenuId()).toBeNull();
  });

  it('should toggle action menu open', () => {
    const event = {
      currentTarget: {
        getBoundingClientRect: () => ({
          right: 200,
          bottom: 300,
          top: 250,
        }),
      },
    } as any;

    component.toggleActionMenu('user1', event);

    expect(component.openActionMenuId()).toBe('user1');
    expect(component.actionMenuPosition()).toBeTruthy();
  });

  it('should toggle action menu closed when same user clicked', () => {
    component.openActionMenuId.set('user1');
    component.actionMenuPosition.set({ top: 100, left: 50 });

    const event = {
      currentTarget: {
        getBoundingClientRect: () => ({
          right: 200,
          bottom: 300,
          top: 250,
        }),
      },
    } as any;

    component.toggleActionMenu('user1', event);

    expect(component.openActionMenuId()).toBeNull();
    expect(component.actionMenuPosition()).toBeNull();
  });

  it('should close action menu on document click outside menu', () => {
    component.openActionMenuId.set('user1');
    const event = {
      target: { closest: () => null },
    } as any;

    component.onDocumentClick(event);

    expect(component.openActionMenuId()).toBeNull();
  });

  it('should not close action menu on document click inside menu', () => {
    component.openActionMenuId.set('user1');
    const event = {
      target: { closest: (sel: string) => (sel === '.action-menu-container' ? {} : null) },
    } as any;

    component.onDocumentClick(event);

    expect(component.openActionMenuId()).toBe('user1');
  });

  it('should handle onImageError', () => {
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.display = 'none';
    const parentDiv = document.createElement('div');
    parentDiv.appendChild(fallbackDiv);

    const img = document.createElement('img');
    parentDiv.appendChild(img);

    const event = { target: img } as any;
    component.onImageError(event);

    expect(img.style.display).toBe('none');
    expect(fallbackDiv.style.display).toBe('flex');
  });

  it('should handle onImageLoad', () => {
    const fallbackDiv = document.createElement('div');
    const parentDiv = document.createElement('div');
    parentDiv.appendChild(fallbackDiv);

    const img = document.createElement('img');
    parentDiv.appendChild(img);

    const event = { target: img } as any;
    component.onImageLoad(event);

    expect(fallbackDiv.style.display).toBe('none');
  });
});
