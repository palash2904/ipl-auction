import { Routes } from '@angular/router';
import { auctionReadyGuard } from './core/guards/auction-ready.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'guide',
    loadComponent: () => import('./features/guide/how-to-play.component').then((m) => m.HowToPlayComponent),
  },
  {
    path: 'setup',
    loadComponent: () => import('./features/setup/setup-page.component').then((m) => m.SetupPageComponent),
  },
  {
    path: 'auction',
    canActivate: [auctionReadyGuard],
    loadComponent: () =>
      import('./features/auction/live-auction-room.component').then((m) => m.LiveAuctionRoomComponent),
  },
  {
    path: 'join',
    canActivate: [auctionReadyGuard],
    loadComponent: () =>
      import('./features/multiplayer/join-room.component').then((m) => m.JoinRoomComponent),
  },
  {
    path: 'dashboard',
    canActivate: [auctionReadyGuard],
    loadComponent: () =>
      import('./features/dashboard/team-dashboard.component').then((m) => m.TeamDashboardComponent),
  },
  {
    path: 'unsold',
    canActivate: [auctionReadyGuard],
    loadComponent: () =>
      import('./features/auction/unsold-page.component').then((m) => m.UnsoldPageComponent),
  },
  {
    path: 'summary',
    canActivate: [auctionReadyGuard],
    loadComponent: () =>
      import('./features/summary/auction-summary.component').then((m) => m.AuctionSummaryComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'setup' },
  { path: '**', redirectTo: 'setup' },
];
