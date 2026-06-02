import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuctionStore } from '../services/auction-store.service';
import { SetupAuthService } from '../services/setup-auth.service';

export const auctionReadyGuard: CanActivateFn = () => {
  const store = inject(AuctionStore);
  const router = inject(Router);
  const setupAuth = inject(SetupAuthService);

  if (store.state().franchises.length >= 2) return true;

  return router.createUrlTree([setupAuth.setupAccess() ? '/setup' : '/guide']);
};
