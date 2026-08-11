import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { ApiService } from '../../services/api.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUser = {
    _id: 'u1',
    nom: 'Doe',
    prenom: 'John',
    email: 'john@test.com',
    role: 'ADMIN',
    status: 'active',
    profilePicture: 'http://example.com/pic.jpg',
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getCurrentUser', 'updateUser', 'getTickets', 'getAssignedDevices']);
    spy.getCurrentUser.and.returnValue(of(mockUser as any));
    spy.getTickets.and.returnValue(of({ tickets: [] }));
    spy.getAssignedDevices.and.returnValue(of({ devices: [] }));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load user data on init', () => {
      component.ngOnInit();
      expect(apiServiceSpy.getCurrentUser).toHaveBeenCalled();
      expect(component.user.prenom).toBe('John');
      expect(component.user.nom).toBe('Doe');
    });
  });

  describe('loadUserData', () => {
    it('should set user data from API response', () => {
      component.loadUserData();
      expect(component.user.prenom).toBe('John');
      expect(component.user.nom).toBe('Doe');
      expect(component.user.email).toBe('john@test.com');
    });

    it('should initialize edit form from API response', () => {
      component.loadUserData();
      expect(component.editForm.prenom).toBe('John');
      expect(component.editForm.nom).toBe('Doe');
      expect(component.editForm.profilePicture).toBe('http://example.com/pic.jpg');
    });

    it('should fallback to localStorage profile picture when API user has none', () => {
      apiServiceSpy.getCurrentUser.and.returnValue(of({
        _id: 'u1', nom: 'Doe', prenom: 'John', profilePicture: ''
      } as any));
      localStorage.setItem('user_profile_picture', 'local-pic.jpg');

      component.loadUserData();
      expect(component.user.profilePicture).toBe('local-pic.jpg');
    });

    it('should fall back to localStorage on API error', () => {
      apiServiceSpy.getCurrentUser.and.returnValue(throwError(() => new Error('fail')));
      localStorage.setItem('user_nom', 'LocalUser');
      localStorage.setItem('user_prenom', 'Local');
      localStorage.setItem('user_email', 'local@test.com');
      localStorage.setItem('user_role', 'IT');
      localStorage.setItem('user_profile_picture', 'local.jpg');
      localStorage.setItem('user_phone', '123');
      localStorage.setItem('user_bio', 'hello');

      component.loadUserData();
      expect(component.user.nom).toBe('LocalUser');
      expect(component.user.prenom).toBe('Local');
      expect(component.user.email).toBe('local@test.com');
      expect(component.user.role).toBe('IT');
      expect(component.user.phone).toBe('123');
      expect(component.user.bio).toBe('hello');
    });
  });

  describe('loadFromLocalStorage', () => {
    it('should load user from localStorage', () => {
      localStorage.setItem('user_nom', 'Smith');
      localStorage.setItem('user_prenom', 'Jane');
      localStorage.setItem('user_email', 'jane@test.com');
      localStorage.setItem('user_role', 'IT');
      localStorage.setItem('user_profile_picture', 'pic.jpg');
      localStorage.setItem('user_phone', '555');
      localStorage.setItem('user_bio', 'bio text');

      component.loadFromLocalStorage();
      expect(component.user.nom).toBe('Smith');
      expect(component.user.prenom).toBe('Jane');
      expect(component.user.email).toBe('jane@test.com');
      expect(component.user.role).toBe('IT');
      expect(component.user.profilePicture).toBe('pic.jpg');
      expect(component.user.phone).toBe('555');
      expect(component.user.bio).toBe('bio text');
    });

    it('should initialize edit form from localStorage data', () => {
      localStorage.setItem('user_nom', 'Smith');
      localStorage.setItem('user_prenom', 'Jane');
      localStorage.setItem('user_profile_picture', 'pic.jpg');

      component.loadFromLocalStorage();
      expect(component.editForm.prenom).toBe('Jane');
      expect(component.editForm.nom).toBe('Smith');
      expect(component.editForm.profilePicture).toBe('pic.jpg');
    });

    it('should default to empty strings when localStorage is empty', () => {
      component.loadFromLocalStorage();
      expect(component.user.nom).toBe('');
      expect(component.user.prenom).toBe('');
      expect(component.user.email).toBe('');
    });
  });

  describe('openEditModal', () => {
    it('should open edit modal', () => {
      component.openEditModal();
      expect(component.isEditModalOpen()).toBe(true);
    });
  });

  describe('closeEditModal', () => {
    it('should close edit modal and clear selectedProfilePicture', () => {
      component.isEditModalOpen.set(true);
      component.selectedProfilePicture.set(new File([''], 'test.jpg'));
      component.closeEditModal();
      expect(component.isEditModalOpen()).toBe(false);
      expect(component.selectedProfilePicture()).toBeNull();
    });
  });

  describe('onProfilePictureSelected', () => {
    it('should set selectedProfilePicture for valid image', () => {
      const event = {
        target: { files: [new File([''], 'test.jpg', { type: 'image/jpeg' })] }
      } as any;
      component.onProfilePictureSelected(event);
      expect(component.selectedProfilePicture()).toBeTruthy();
      expect(component.imageError()).toBe(false);
    });

    it('should set imageError for non-image file', () => {
      const event = {
        target: { files: [new File([''], 'test.txt', { type: 'text/plain' })] }
      } as any;
      component.onProfilePictureSelected(event);
      expect(component.selectedProfilePicture()).toBeNull();
      expect(component.imageError()).toBe(true);
    });

    it('should handle event with no files', () => {
      const event = {
        target: { files: null }
      } as any;
      component.onProfilePictureSelected(event);
      expect(component.selectedProfilePicture()).toBeNull();
    });
  });

  describe('formatFileSize', () => {
    it('should format file size', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
    });
  });

  describe('saveProfile', () => {
    it('should save profile via API when userId exists', () => {
      localStorage.setItem('user_id', 'u1');
      component.editForm = { prenom: 'Jane', nom: 'Smith', profilePicture: 'pic.jpg' };
      apiServiceSpy.updateUser.and.returnValue(of({ ...mockUser, nom: 'Smith', prenom: 'Jane' } as any));
      spyOn(component, 'closeEditModal');

      component.saveProfile();

      expect(apiServiceSpy.updateUser).toHaveBeenCalledWith('u1', {
        nom: 'Smith',
        prenom: 'Jane',
        profilePicture: 'pic.jpg'
      });
    });

    it('should save profile to localStorage only when no userId', () => {
      component.editForm = { prenom: 'Jane', nom: 'Smith', profilePicture: 'pic.jpg' };
      spyOn(component, 'closeEditModal');

      component.saveProfile();

      expect(localStorage.getItem('user_prenom')).toBe('Jane');
      expect(localStorage.getItem('user_nom')).toBe('Smith');
      expect(component.closeEditModal).toHaveBeenCalled();
    });

    it('should update user object after API save', () => {
      localStorage.setItem('user_id', 'u1');
      component.editForm = { prenom: 'Jane', nom: 'Smith', profilePicture: 'pic.jpg' };
      apiServiceSpy.updateUser.and.returnValue(of({ ...mockUser, nom: 'Smith', prenom: 'Jane' } as any));

      component.saveProfile();

      expect(component.user.prenom).toBe('Jane');
      expect(component.user.nom).toBe('Smith');
      expect(component.user.profilePicture).toBe('pic.jpg');
    });

    it('should handle API error on save', () => {
      localStorage.setItem('user_id', 'u1');
      component.editForm = { prenom: 'Jane', nom: 'Smith', profilePicture: 'pic.jpg' };
      apiServiceSpy.updateUser.and.returnValue(throwError(() => new Error('fail')));
      spyOn(window, 'alert');

      component.saveProfile();

      expect(component.saving()).toBe(false);
      expect(window.alert).toHaveBeenCalled();
    });

    it('should update user object on localStorage fallback save', () => {
      component.editForm = { prenom: 'Jane', nom: 'Smith', profilePicture: 'pic.jpg' };

      component.saveProfile();

      expect(component.user.prenom).toBe('Jane');
      expect(component.user.nom).toBe('Smith');
      expect(component.user.profilePicture).toBe('pic.jpg');
    });
  });

  describe('uploadProfilePicture', () => {
    it('should return early if no selectedProfilePicture', async () => {
      component.selectedProfilePicture.set(null);
      await component.uploadProfilePicture();
      expect(component.uploadingProfilePicture()).toBe(false);
    });
  });

  describe('getTicketStatusColor', () => {
    it('should return correct colors for known statuses', () => {
      expect(component.getTicketStatusColor('open')).toContain('blue');
      expect(component.getTicketStatusColor('in_progress')).toContain('amber');
      expect(component.getTicketStatusColor('resolved')).toContain('emerald');
      expect(component.getTicketStatusColor('closed')).toContain('gray');
    });

    it('should return default for unknown status', () => {
      expect(component.getTicketStatusColor('unknown')).toContain('gray');
    });
  });

  describe('getTicketPriorityColor', () => {
    it('should return correct colors for known priorities', () => {
      expect(component.getTicketPriorityColor('urgent')).toContain('red');
      expect(component.getTicketPriorityColor('high')).toContain('orange');
      expect(component.getTicketPriorityColor('medium')).toContain('yellow');
      expect(component.getTicketPriorityColor('low')).toContain('green');
    });

    it('should return default for unknown priority', () => {
      expect(component.getTicketPriorityColor('unknown')).toContain('gray');
    });
  });

  describe('getDeviceStatusColor', () => {
    it('should return correct colors for known statuses', () => {
      expect(component.getDeviceStatusColor('available')).toContain('emerald');
      expect(component.getDeviceStatusColor('assigned')).toContain('blue');
      expect(component.getDeviceStatusColor('maintenance')).toContain('amber');
      expect(component.getDeviceStatusColor('retired')).toContain('gray');
    });

    it('should return default for unknown status', () => {
      expect(component.getDeviceStatusColor('unknown')).toContain('gray');
    });
  });

  describe('getTicketStatusLabel', () => {
    it('should return French labels', () => {
      expect(component.getTicketStatusLabel('open')).toBe('Ouvert');
      expect(component.getTicketStatusLabel('in_progress')).toBe('En cours');
      expect(component.getTicketStatusLabel('resolved')).toBe('Résolu');
      expect(component.getTicketStatusLabel('closed')).toBe('Fermé');
    });

    it('should return raw key for unknown', () => {
      expect(component.getTicketStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('getDeviceStatusLabel', () => {
    it('should return French labels', () => {
      expect(component.getDeviceStatusLabel('available')).toBe('Disponible');
      expect(component.getDeviceStatusLabel('assigned')).toBe('Assigné');
      expect(component.getDeviceStatusLabel('maintenance')).toBe('Maintenance');
      expect(component.getDeviceStatusLabel('retired')).toBe('Retiré');
    });

    it('should return raw key for unknown', () => {
      expect(component.getDeviceStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return French labels', () => {
      expect(component.getPriorityLabel('urgent')).toBe('Urgent');
      expect(component.getPriorityLabel('high')).toBe('Haute');
      expect(component.getPriorityLabel('medium')).toBe('Moyenne');
      expect(component.getPriorityLabel('low')).toBe('Basse');
    });

    it('should return raw key for unknown', () => {
      expect(component.getPriorityLabel('unknown')).toBe('unknown');
    });
  });
});
