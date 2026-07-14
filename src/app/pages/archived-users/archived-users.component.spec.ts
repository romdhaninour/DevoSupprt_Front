/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchivedUsersComponent } from './archived-users.component';
import { ApiService } from '../../services/api.service';
import { of, throwError } from 'rxjs';
import { User } from '../../models/user.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ArchivedUsersComponent', () => {
  let component: ArchivedUsersComponent;
  let fixture: ComponentFixture<ArchivedUsersComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockArchivedUsers: User[] = [
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
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getArchivedUsers',
      'restoreUser',
      'deleteUser',
    ]);

    await TestBed.configureTestingModule({
      imports: [ArchivedUsersComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivedUsersComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize signals with default values', () => {
    expect(component.users()).toEqual([]);
    expect(component.loading()).toBe(true);
    expect(component.error()).toBeNull();
    expect(component.searchTerm()).toBe('');
    expect(component.roleFilter()).toBe('all');
  });

  it('should return correct role badge color for ADMIN', () => {
    const color = component.getRoleBadgeColor('ADMIN');
    expect(color).toContain('rose');
  });

  it('should return correct role badge color for CONSULTANT', () => {
    const color = component.getRoleBadgeColor('CONSULTANT');
    expect(color).toContain('cyan');
  });

  it('should return correct role badge color for IT', () => {
    const color = component.getRoleBadgeColor('IT');
    expect(color).toContain('amber');
  });

  it('should return default color for unknown role', () => {
    const color = component.getRoleBadgeColor('UNKNOWN');
    expect(color).toContain('gray');
  });

  it('should calculate total pages correctly', () => {
    component.users.set(mockArchivedUsers);
    component.itemsPerPage = 1;
    expect(component.totalPages).toBe(2);
  });

  it('should return paginated users', () => {
    component.users.set(mockArchivedUsers);
    component.itemsPerPage = 1;
    component.goToPage(1);
    expect(component.paginatedUsers.length).toBe(1);
  });

  it('should not navigate to invalid pages', () => {
    component.users.set(mockArchivedUsers);
    component.itemsPerPage = 1;
    component.goToPage(1);
    component.goToPage(999);
    expect(component.currentPage).toBe(1);
  });

  it('should update search term', () => {
    component.updateSearchTerm('test');
    expect(component.searchTerm()).toBe('test');
    expect(component.currentPage).toBe(1);
  });

  it('should update role filter', () => {
    component.updateRoleFilter('ADMIN');
    expect(component.roleFilter()).toBe('ADMIN');
    expect(component.currentPage).toBe(1);
  });
});
