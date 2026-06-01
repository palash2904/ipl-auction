import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuctionStore } from '../../core/services/auction-store.service';
import { AiCommentaryService } from '../../core/services/ai-commentary.service';
import { MultiplayerSessionService } from '../../core/services/multiplayer-session.service';
import { Player } from '../../models/auction.models';
import { CrorePipe } from '../../shared/pipes/crore.pipe';

@Component({
  selector: 'app-live-auction-room',
  standalone: true,
  imports: [CommonModule, CrorePipe],
  templateUrl: './live-auction-room.component.html',
})
export class LiveAuctionRoomComponent {
  protected readonly store = inject(AuctionStore);
  protected readonly ai = inject(AiCommentaryService);
  protected readonly session = inject(MultiplayerSessionService);
  private readonly router = inject(Router);
  private readonly currentSetPlayerOrders = new Map<number, string[]>();
  protected readonly currentSetPlayers = computed(() => {
    const currentSetNumber = this.store.currentPlayer()?.setNumber;
    if (!currentSetNumber) return [];
    const players = this.store.state().players.filter((player) => player.setNumber === currentSetNumber);
    return this.randomizedSetPlayers(currentSetNumber, players);
  });
  protected bidError = '';
  protected soldFlash = false;
  protected aiLine = '';
  protected aiLoading = false;
  protected showCurrentSet = false;

  constructor() {
    effect(() => {
      if (this.store.state().phase === 'complete') {
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

  bid(teamId: string): void {
    if (!this.session.canBid(teamId)) {
      this.bidError = 'Join as this team owner to place that bid.';
      return;
    }
    const error = this.store.bid(teamId);
    this.bidError = error ?? '';
  }

  pass(teamId: string): void {
    if (!this.session.canBid(teamId)) {
      this.bidError = 'Join as this team owner to pass for that team.';
      return;
    }
    const error = this.store.pass(teamId);
    this.bidError = error ?? '';
  }

  sell(): void {
    if (!this.session.canControlAuction()) return;
    this.soldFlash = true;
    this.store.sellCurrentPlayer();
    setTimeout(() => (this.soldFlash = false), 1000);
  }

  unsold(): void {
    if (!this.session.canControlAuction()) return;
    this.store.markUnsold();
  }

  endAuction(): void {
    if (!this.session.canControlAuction()) return;
    if (!confirm('Are you sure you want to end the auction?')) return;
    this.store.endAuction();
    this.router.navigateByUrl('/dashboard');
  }

  async generateCommentary(): Promise<void> {
    this.aiLoading = true;
    this.aiLine = await this.ai.generateAuctioneerLine();
    this.aiLoading = false;
  }

  statusFor(playerId: string): string {
    const player = this.store.state().players.find((item) => item.id === playerId);
    if (!player) return 'Unknown';
    if (player.id === this.store.state().currentPlayerId && player.status === 'available') return 'Current';
    if (player.status === 'sold') {
      const team = this.store.state().franchises.find((item) => item.id === player.soldTo);
      return team ? `Sold to ${team.franchiseName}` : 'Sold';
    }
    if (player.status === 'unsold') return 'Unsold';
    return 'Available';
  }

  statusClassFor(playerId: string): string {
    const player = this.store.state().players.find((item) => item.id === playerId);
    if (!player) return 'status-unknown';
    if (player.id === this.store.state().currentPlayerId && player.status === 'available') return 'status-current';
    return `status-${player.status}`;
  }

  private randomizedSetPlayers(setNumber: number, players: Player[]): Player[] {
    const playerIds = new Set(players.map((player) => player.id));
    const cachedOrder = this.currentSetPlayerOrders.get(setNumber);

    if (!cachedOrder || cachedOrder.length !== players.length || cachedOrder.some((id) => !playerIds.has(id))) {
      this.currentSetPlayerOrders.set(setNumber, this.shuffleIds(players.map((player) => player.id)));
    }

    const order = this.currentSetPlayerOrders.get(setNumber) ?? [];
    const orderIndex = new Map(order.map((id, index) => [id, index]));

    return [...players].sort(
      (first, second) =>
        (orderIndex.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderIndex.get(second.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  private shuffleIds(ids: string[]): string[] {
    const shuffled = [...ids];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }
}
