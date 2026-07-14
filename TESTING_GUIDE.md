# Angular Unit Testing Guide - Devo Support Front

## Overview
This document provides guidance on running, writing, and maintaining unit tests for the Devo_Support_Front Angular application.

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (Recommended for Development)
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --code-coverage
```

### Run Specific Test File
```bash
ng test --include='**/guards/auth.guard.spec.ts'
```

### Run Tests Headless (CI/CD)
```bash
ng test --watch=false --browsers=ChromeHeadless
```

## Test Files Created

### 1. **Guard Tests** (`src/app/guards/`)
- **auth.guard.spec.ts** - Tests for functional auth guard
  - ✅ Allows access when token exists
  - ✅ Denies access and redirects to signin when token missing
  - ✅ Handles empty token strings

- **admin.guard.spec.ts** - Tests for AdminGuard class
  - ✅ Allows access for ADMIN role
  - ✅ Denies access for non-admin users
  - ✅ Handles missing user_role in localStorage

- **it.guard.spec.ts** - Tests for ITGuard class
  - ✅ Allows access for IT and ADMIN roles
  - ✅ Denies access for other roles
  - ✅ Handles missing user_role

### 2. **Service Tests** (`src/app/services/`)
- **api.service.spec.ts** - HTTP API service tests
  - ✅ Service creation
  - ✅ Auth header injection
  - ✅ GET requests (getUsers)
  - ✅ Additional methods...

- **notification.service.spec.ts** - Notification service tests
  - ✅ Service creation
  - ✅ Load notifications from localStorage
  - ✅ Add notifications
  - ✅ Mark as read
  - ✅ Mark all as read
  - ✅ Clear all notifications
  - ✅ Unread count tracking

### 3. **Component Tests** (`src/app/pages/`)
- **ecommerce.component.spec.ts** - Dashboard component
  - ✅ Component creation
  - ✅ Sub-component imports

- **sign-in.component.spec.ts** - Authentication page
  - ✅ Component creation
  - ✅ Query parameter handling
  - ✅ Message display logic

- **archived-users.component.spec.ts** - User archive management
  - ✅ Component creation
  - ✅ Signal initialization
  - ✅ Search functionality
  - ✅ Role filtering
  - ✅ Pagination
  - ✅ Badge color assignment

## Writing New Tests

### Service Test Template
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyService],
    });

    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

### Component Test Template
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';
import { MyService } from './my.service';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;
  let serviceSpy: jasmine.SpyObj<MyService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('MyService', ['method1', 'method2']);

    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [{ provide: MyService, useValue: spy }]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(MyService) as jasmine.SpyObj<MyService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Guard Test Template
```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { myGuard } from './my.guard';

describe('myGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    });
    router = TestBed.inject(Router);
  });

  it('should allow/deny access', () => {
    const result = TestBed.runInInjectionContext(() => myGuard({} as any, {} as any));
    expect(result).toBe(true);
  });
});
```

## Testing Best Practices

### 1. **Use Spy Objects for Dependencies**
```typescript
const spy = jasmine.createSpyObj('Service', ['method1', 'method2']);
TestBed.configureTestingModule({
  providers: [{ provide: Service, useValue: spy }]
});
```

### 2. **Test User Interactions**
```typescript
it('should handle click', () => {
  spyOn(component, 'onClick');
  const button = fixture.nativeElement.querySelector('button');
  button.click();
  expect(component.onClick).toHaveBeenCalled();
});
```

### 3. **Mock HTTP Requests**
```typescript
service.getData().subscribe(data => {
  expect(data).toEqual(mockData);
});

const req = httpMock.expectOne('/api/data');
expect(req.request.method).toBe('GET');
req.flush(mockData);
```

### 4. **Test Signals and Computed Values** (Angular 17+)
```typescript
component.users.set(mockUsers);
fixture.detectChanges();

expect(component.filteredUsers()).toEqual(expectedResult);
```

### 5. **Test Async Operations**
```typescript
it('should handle async operation', (done) => {
  service.asyncMethod().subscribe(result => {
    expect(result).toEqual(expected);
    done();
  });
});
```

### 6. **Clean Up After Tests**
```typescript
afterEach(() => {
  localStorage.clear();
  httpMock.verify();
});
```

## Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Common Issues & Solutions

### Issue: "Cannot find module '@angular/core/testing'"
**Solution**: Ensure `@types/jasmine` is installed:
```bash
npm install --save-dev @types/jasmine
```

### Issue: "Unexpected token" in tests
**Solution**: Make sure `tsconfig.spec.json` includes `"types": ["jasmine"]`

### Issue: Tests timeout
**Solution**: Increase timeout in specific tests:
```typescript
it('slow test', (done) => {
  // test code
}, 10000); // 10 second timeout
```

### Issue: localStorage not clearing between tests
**Solution**: Add to afterEach:
```typescript
afterEach(() => {
  localStorage.clear();
});
```

## Next Steps

### High Priority Tests to Create
- [ ] device-allocation component
- [ ] device-management component
- [ ] user-management service tests (additional)
- [ ] profile component
- [ ] chat component

### Medium Priority Tests to Create
- [ ] All shared components
- [ ] All UI elements
- [ ] Form validation tests
- [ ] Chart components

### Coverage Reports
Generate and review coverage reports:
```bash
npm test -- --code-coverage
# Then open: coverage/index.html
```

## Resources
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Test Runner](https://karma-runner.github.io/)
- [Angular Testing Best Practices](https://angular.io/guide/testing-best-practices)
