import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ITGuard } from './it.guard';

describe('ITGuard', () => {
  let guard: ITGuard;
  let router: Router;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ITGuard,
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate'])
        }
      ]
    });
    
    guard = TestBed.inject(ITGuard);
    router = TestBed.inject(Router);
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {} as RouterStateSnapshot;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is IT', () => {
    localStorage.setItem('user_role', 'IT');
    
    const result = guard.canActivate(mockRoute, mockState);
    
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when user is ADMIN', () => {
    localStorage.setItem('user_role', 'ADMIN');
    
    const result = guard.canActivate(mockRoute, mockState);
    
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and navigate to dashboard when user is CONSULTANT', () => {
    localStorage.setItem('user_role', 'CONSULTANT');
    
    const result = guard.canActivate(mockRoute, mockState);
    
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should deny access when user_role is not set', () => {
    localStorage.removeItem('user_role');
    
    const result = guard.canActivate(mockRoute, mockState);
    
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should deny access for other roles', () => {
    localStorage.setItem('user_role', 'UNKNOWN');
    
    const result = guard.canActivate(mockRoute, mockState);
    
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
