/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EcommerceComponent } from './ecommerce.component';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('EcommerceComponent', () => {
  let component: EcommerceComponent;
  let fixture: ComponentFixture<EcommerceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcommerceComponent, CommonModule],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements (sub-components)
    }).compileComponents();

    fixture = TestBed.createComponent(EcommerceComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component template', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });
});
