import { Component, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuctionStore } from './core/services/auction-store.service';
import { FirebaseAuctionSyncService } from './core/services/firebase-auction-sync.service';
import { MultiplayerSessionService } from './core/services/multiplayer-session.service';
import { SetupAuthService } from './core/services/setup-auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, UpperCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(AuctionStore);
  protected readonly sync = inject(FirebaseAuctionSyncService);
  protected readonly session = inject(MultiplayerSessionService);
  protected readonly setupAuth = inject(SetupAuthService);
}
