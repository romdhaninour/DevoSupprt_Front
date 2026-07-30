import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackdropComponent } from './backdrop.component';
import { SidebarService } from '../../services/sidebar.service';
import { of } from 'rxjs';

describe('BackdropComponent', () => {
  let component: BackdropComponent;
  let fixture: ComponentFixture<BackdropComponent>;
  let sidebarServiceSpy: jasmine.SpyObj<SidebarService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('SidebarService', ['setMobileOpen'], {
      isMobileOpen$: of(false)
    });

    await TestBed.configureTestingModule({
      imports: [BackdropComponent],
      providers: [{ provide: SidebarService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(BackdropComponent);
    component = fixture.componentInstance;
    sidebarServiceSpy = TestBed.inject(SidebarService) as jasmine.SpyObj<SidebarService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose isMobileOpen$ from sidebar service', () => {
    expect(component.isMobileOpen$).toBeTruthy();
  });

  it('should call setMobileOpen(false) on closeSidebar', () => {
    component.closeSidebar();
    expect(sidebarServiceSpy.setMobileOpen).toHaveBeenCalledWith(false);
  });
});
