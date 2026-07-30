import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SidebarService]
    });
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to expanded', () => {
    let expanded = false;
    service.isExpanded$.subscribe(v => expanded = v);
    expect(expanded).toBe(true);
  });

  it('should default mobile closed', () => {
    let mobileOpen = true;
    service.isMobileOpen$.subscribe(v => mobileOpen = v);
    expect(mobileOpen).toBe(false);
  });

  it('should default hovered to false', () => {
    let hovered = true;
    service.isHovered$.subscribe(v => hovered = v);
    expect(hovered).toBe(false);
  });

  it('should set expanded', () => {
    service.setExpanded(false);
    let expanded = true;
    service.isExpanded$.subscribe(v => expanded = v);
    expect(expanded).toBe(false);
  });

  it('should toggle expanded', () => {
    service.toggleExpanded();
    let expanded = true;
    service.isExpanded$.subscribe(v => expanded = v);
    expect(expanded).toBe(false);
  });

  it('should toggle expanded back to true', () => {
    service.toggleExpanded();
    service.toggleExpanded();
    let expanded = false;
    service.isExpanded$.subscribe(v => expanded = v);
    expect(expanded).toBe(true);
  });

  it('should set mobile open', () => {
    service.setMobileOpen(true);
    let mobileOpen = false;
    service.isMobileOpen$.subscribe(v => mobileOpen = v);
    expect(mobileOpen).toBe(true);
  });

  it('should toggle mobile open', () => {
    service.toggleMobileOpen();
    let mobileOpen = false;
    service.isMobileOpen$.subscribe(v => mobileOpen = v);
    expect(mobileOpen).toBe(true);
  });

  it('should toggle mobile open back to false', () => {
    service.toggleMobileOpen();
    service.toggleMobileOpen();
    let mobileOpen = true;
    service.isMobileOpen$.subscribe(v => mobileOpen = v);
    expect(mobileOpen).toBe(false);
  });

  it('should set hovered', () => {
    service.setHovered(true);
    let hovered = false;
    service.isHovered$.subscribe(v => hovered = v);
    expect(hovered).toBe(true);
  });

  it('should emit all observable changes', () => {
    const expandedValues: boolean[] = [];
    const mobileValues: boolean[] = [];
    const hoveredValues: boolean[] = [];

    service.isExpanded$.subscribe(v => expandedValues.push(v));
    service.isMobileOpen$.subscribe(v => mobileValues.push(v));
    service.isHovered$.subscribe(v => hoveredValues.push(v));

    service.setExpanded(false);
    service.setMobileOpen(true);
    service.setHovered(true);

    expect(expandedValues).toEqual([true, false]);
    expect(mobileValues).toEqual([false, true]);
    expect(hoveredValues).toEqual([false, true]);
  });
});
