import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigninFormComponent } from './signin-form.component';
import { provideRouter } from '@angular/router';

describe('SigninFormComponent', () => {
  let component: SigninFormComponent;
  let fixture: ComponentFixture<SigninFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SigninFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SigninFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.showPassword).toBe(false);
    expect(component.isChecked).toBe(false);
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.message).toBe('');
  });

  it('should toggle password visibility', () => {
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(false);
  });

  it('should accept message input', () => {
    component.message = 'test message';
    expect(component.message).toBe('test message');
  });

  it('should have onSignIn method', () => {
    spyOn(console, 'log');
    component.email = 'test@test.com';
    component.password = 'pass123';
    component.isChecked = true;
    component.onSignIn();
    expect(console.log).toHaveBeenCalledWith('Email:', 'test@test.com');
    expect(console.log).toHaveBeenCalledWith('Password:', 'pass123');
    expect(console.log).toHaveBeenCalledWith('Remember Me:', true);
  });

  it('should have signInWithGoogle method', () => {
    expect(component.signInWithGoogle).toBeTruthy();
  });
});
