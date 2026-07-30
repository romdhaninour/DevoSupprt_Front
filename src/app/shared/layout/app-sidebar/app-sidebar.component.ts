import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarWidgetComponent } from './app-sidebar-widget.component';
import { combineLatest, Subscription } from 'rxjs';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
    SidebarWidgetComponent
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

  // Shared nav items for all authenticated roles
  navItems: NavItem[] = [
    {
      name: "Tableau de bord",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      path: "/",
    },
    {
      name: "Mes tickets",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7H4z" stroke="currentColor" stroke-width="1.2"/><path d="M8 11h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
      path: "/my-tickets",
    },
    {
      name: "Chat",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.2"/></svg>`,
      path: "/chat",
    },
  ];

  // IT-only nav items
  itNavItems: NavItem[] = [
    {
      name: "Tickets",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7H4z" stroke="currentColor" stroke-width="1.2"/><path d="M8 11h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
      path: "/tickets",
    },
    {
      name: "Utilisateurs",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20c0-2.209 3.582-4 8-4s8 1.791 8 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      path: "/user-management",
    },
    {
      name: "Appareils",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M8 19h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      path: '/device-management',
    },
    {
      name: "Maintenance",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.2"/></svg>`,
      path: '/device-maintenance',
    },
    {
      name: "Mes appareils",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="18" r="0.8" fill="currentColor"/></svg>`,
      path: '/consultant-devices',
    }
  ];

  // Admin-only nav items
  adminNavItems: NavItem[] = [
    {
      name: "Tickets",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7H4z" stroke="currentColor" stroke-width="1.2"/><path d="M8 11h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
      path: "/tickets",
    },
    {
      name: "Utilisateurs",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20c0-2.209 3.582-4 8-4s8 1.791 8 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      path: "/user-management",
    },
    {
      name: "Appareils",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M8 19h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      path: '/device-management',
    },
    {
      name: "Maintenance",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.2"/></svg>`,
      path: '/device-maintenance',
    },
    {
      name: "Mes appareils",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="18" r="0.8" fill="currentColor"/></svg>`,
      path: '/consultant-devices',
    }
  ];

  // Consultant nav items
  consultantNavItems: NavItem[] = [
    {
      name: "Mes appareils",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="18" r="0.8" fill="currentColor"/></svg>`,
      path: '/consultant-devices',
    }
  ];

  // Others nav items - removed for cleaner sidebar
  othersItems: NavItem[] = [];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  // Combined nav items based on user role
  get combinedNavItems(): NavItem[] {
    const userRole = localStorage.getItem('user_role');
    const isAdmin = userRole === 'ADMIN';
    const isIT = userRole === 'IT';
    const isConsultant = userRole === 'CONSULTANT';

    // Build base merged set depending on role
    let mergedSource: NavItem[] = [];
    if (isAdmin) mergedSource = [...this.navItems, ...this.adminNavItems, ...this.consultantNavItems];
    else if (isIT) mergedSource = [...this.navItems, ...this.itNavItems, ...this.consultantNavItems];
    else mergedSource = [...this.navItems, ...this.consultantNavItems];

    // Deduplicate by path preserving first occurrence
    const dedupMap = new Map<string | undefined, NavItem>();
    for (const item of mergedSource) {
      if (!dedupMap.has(item.path)) dedupMap.set(item.path, item);
    }

    const deduped = Array.from(dedupMap.values());

    // Apply role-based filtering: admin sees everything; IT cannot see 'Utilisateurs';
    // Consultants cannot see 'Utilisateurs', 'Appareils', 'Maintenance', and 'Types d'appareils'.
    let allowed: NavItem[];
    if (isAdmin) {
      allowed = deduped;
    } else if (isIT) {
      allowed = deduped.filter(i => i.path !== '/user-management');
    } else if (isConsultant) {
      allowed = deduped.filter(i => i.path !== '/user-management' && i.path !== '/device-management' && i.path !== '/device-types' && i.path !== '/device-maintenance');
    } else {
      // default: be conservative
      allowed = deduped.filter(i => i.path !== '/user-management' && i.path !== '/device-management' && i.path !== '/device-types' && i.path !== '/device-maintenance');
    }

    // Desired ordering: Utilisateurs, Appareils, Maintenance, Mes appareils, Tickets, Chat, then any remaining
    const lookup = (path: string) => allowed.find(i => i.path === path);
    const orderedPaths = ['/', '/user-management', '/device-management', '/device-maintenance', '/device-types', '/consultant-devices', '/tickets', '/my-tickets', '/chat'];
    const ordered: NavItem[] = [];
    for (const p of orderedPaths) {
      const it = lookup(p);
      if (it && !ordered.find(o => o.path === it.path)) ordered.push(it);
    }

    // append any remaining allowed items
    for (const item of allowed) {
      if (!ordered.find(o => o.path === item.path)) ordered.push(item);
    }

    return ordered;
  }

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        }
      )
    );

    // Initial load
    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.normalizeUrl(this.router.url) === this.normalizeUrl(path);
  }

  private normalizeUrl(url: string): string {
    return url.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  }

  isSubmenuActive(index: number): boolean {
    const nav = this.combinedNavItems[index];
    if (!nav?.subItems) {
      return false;
    }

    return nav.subItems.some((subItem) => this.isActive(subItem.path)) || this.openSubmenu === `main-${index}`;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges(); // Ensure UI updates
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.combinedNavItems, prefix: 'main' },
    ];

    this.openSubmenu = null;
    this.subMenuHeights = {};

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          const isActiveGroup = nav.subItems.some((subItem) => this.isActive(subItem.path));

          if (isActiveGroup) {
            const key = `${group.prefix}-${i}`;
            this.openSubmenu = key;

            setTimeout(() => {
              const el = document.getElementById(key);
              if (el) {
                this.subMenuHeights[key] = el.scrollHeight;
                this.cdr.detectChanges();
              }
            });
          }
        }
      });
    });
  }

  onSubmenuClick() {
    console.log('click submenu');
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }  

  
}
