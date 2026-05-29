import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuctionStore } from '../services/auction-store.service';

export const auctionReadyGuard: CanActivateFn = () => {
  const store = inject(AuctionStore);
  const router = inject(Router);
  return store.state().franchises.length >= 2 || router.createUrlTree(['/setup']);
};
