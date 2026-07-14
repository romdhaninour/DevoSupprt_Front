import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate'])
        }
      ]
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow access when token exists', () => {
    localStorage.setItem('auth_token', 'valid-token');
    
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and navigate to signin when token does not exist', () => {
    localStorage.removeItem('auth_token');
    
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('should deny access and navigate to signin when token is empty string', () => {
    localStorage.setItem('auth_token', '');
    
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/signin']);
  });
});
