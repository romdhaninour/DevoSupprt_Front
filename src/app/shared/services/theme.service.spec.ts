import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark:bg-gray-900');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to light theme when no saved theme', () => {
    let currentTheme: string = '';
    service.theme$.subscribe(t => currentTheme = t);
    expect(currentTheme).toBe('light');
  });

  it('should load saved theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    TestBed.resetTestingModule();
    const newService = TestBed.inject(ThemeService);
    let currentTheme: string = '';
    newService.theme$.subscribe(t => currentTheme = t);
    expect(currentTheme).toBe('dark');
  });

  it('should toggle from light to dark', () => {
    service.setTheme('light');
    service.toggleTheme();
    let currentTheme: string = '';
    service.theme$.subscribe(t => currentTheme = t);
    expect(currentTheme).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    service.setTheme('dark');
    service.toggleTheme();
    let currentTheme: string = '';
    service.theme$.subscribe(t => currentTheme = t);
    expect(currentTheme).toBe('light');
  });

  it('should set theme to dark and add dark class', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('dark:bg-gray-900')).toBe(true);
  });

  it('should set theme to light and remove dark class', () => {
    service.setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.body.classList.contains('dark:bg-gray-900')).toBe(false);
  });

  it('should emit theme changes to subscribers', () => {
    const themes: string[] = [];
    service.theme$.subscribe(t => themes.push(t));

    service.setTheme('dark');
    service.setTheme('light');

    expect(themes).toEqual(['light', 'dark', 'light']);
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    service.setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
