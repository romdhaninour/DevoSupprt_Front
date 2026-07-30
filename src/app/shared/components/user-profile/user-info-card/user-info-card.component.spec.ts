import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserInfoCardComponent } from './user-info-card.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UserInfoCardComponent', () => {
  let component: UserInfoCardComponent;
  let fixture: ComponentFixture<UserInfoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInfoCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserInfoCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default empty user', () => {
    expect(component.user).toEqual({});
  });

  it('should accept user input', () => {
    const testUser = { nom: 'Doe', prenom: 'John', email: 'john@test.com' };
    component.user = testUser;
    expect(component.user).toEqual(testUser);
  });

  it('should render without errors', () => {
    component.user = { nom: 'Doe', prenom: 'John', email: 'john@test.com', role: 'ADMIN' };
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
