import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { ArchivedUsersComponent } from './pages/archived-users/archived-users.component';
import { DeviceManagementComponent } from './pages/device-management/device-management.component';
import { DeviceAllocationComponent } from './pages/device-allocation/device-allocation.component';
import { TicketsComponent } from './pages/tickets/tickets.component';
import { ChatComponent } from './pages/chat/chat.component';
import { ConsultantDevicesComponent } from './pages/consultant-devices/consultant-devices.component';
import { DeviceTypesComponent } from './pages/device-types/device-types.component';
import { UserDetailComponent } from './pages/user-detail/user-detail.component';
import { TicketDetailComponent } from './pages/ticket-detail/ticket-detail.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { DeviceMaintenanceComponent } from './pages/device-maintenance/device-maintenance.component';
import { DeviceMaintenanceDetailComponent } from './pages/device-maintenance-detail/device-maintenance-detail.component';
import { DeviceDetailComponent } from './pages/device-detail/device-detail.component';
import { authGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ITGuard } from './guards/it.guard';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Tableau de bord | DevoSupport',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Calendrier | DevoSupport'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Profil | DevoSupport'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Éléments de formulaire | DevoSupport'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Tableaux | DevoSupport'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Page vide | DevoSupport'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Factures | DevoSupport'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Graphiques linéaires | DevoSupport'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Graphiques à barres | DevoSupport'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Alertes | DevoSupport'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Avatars | DevoSupport'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Badges | DevoSupport'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Boutons | DevoSupport'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Images | DevoSupport'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Vidéos | DevoSupport'
      },
      {
        path:'user-management',
        component:UserManagementComponent,
        canActivate: [AdminGuard],
        title:'User Management | DevoSupport'
      },
      {
        path:'archived-users',
        component:ArchivedUsersComponent,
        canActivate: [AdminGuard],
        title:'Archived Users | DevoSupport'
      },
      {
        path:'device-management',
        component:DeviceManagementComponent,
        canActivate: [ITGuard],
        title:'Device Management | DevoSupport'
      },
      {
        path:'device-management/:id',
        component:DeviceDetailComponent,
        canActivate: [ITGuard],
        title:'Détails Appareil | DevoSupport'
      },
      {
        path:'device-types',
        component:DeviceTypesComponent,
        canActivate: [ITGuard],
        title:"Types d'appareils | DevoSupport"
      },
      {
        path:'device-maintenance',
        component:DeviceMaintenanceComponent,
        canActivate: [ITGuard],
        title:'Maintenance des appareils | DevoSupport'
      },
      {
        path:'device-maintenance/:id',
        component:DeviceMaintenanceDetailComponent,
        canActivate: [ITGuard],
        title:'Détails Maintenance | DevoSupport'
      },
      {
        path:'device-allocation',
        component:DeviceAllocationComponent,
        canActivate: [ITGuard],
        title:'Device Allocation | DevoSupport'
      },
      {
        path:'tickets',
        component:TicketsComponent,
        canActivate: [ITGuard],
        title:'Tickets | DevoSupport'
      },
      {
        path:'my-tickets',
        component:TicketsComponent,
        title:'Mes tickets | DevoSupport'
      },
      {
        path:'tickets/:id',
        component:TicketDetailComponent,
        title:'D\u00e9tails Ticket | DevoSupport'
      },
      {
        path:'my-tickets/:id',
        component:TicketDetailComponent,
        title:'D\u00e9tails Ticket | DevoSupport'
      },
      {
        path:'chat',
        component:ChatComponent,
        title:'Chat | DevoSupport'
      },
      {
        path:'consultant-devices',
        component:ConsultantDevicesComponent,
        title:'Consultant Devices | DevoSupport'
      },
      {
        path:'user-management/:id',
        component:UserDetailComponent,
        title:'Détails Utilisateur | DevoSupport'
      },
      {
        path:'archived-users/:id',
        component:UserDetailComponent,
        title:'Détails Utilisateur Archivé | DevoSupport'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Connexion | DevoSupport'
  },
  {
    path:'auth/callback',
    component:AuthCallbackComponent,
    title:'Auth Callback | DevoSupport'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Page introuvable | DevoSupport'
  },
];
