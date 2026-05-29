import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuctionStore } from '../../core/services/auction-store.service';
import { AiCommentaryService } from '../../core/services/ai-commentary.service';
import { MultiplayerSessionService } from '../../core/services/multiplayer-session.service';
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
  protected bidError = '';
  protected soldFlash = false;
  protected aiLine = '';
  protected aiLoading = false;

  bid(teamId: string): void {
    if (!this.session.canBid(teamId)) {
      this.bidError = 'Join as this team owner to place that bid.';
      return;
    }
    const error = this.store.bid(teamId);
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

  async generateCommentary(): Promise<void> {
    this.aiLoading = true;
    this.aiLine = await this.ai.generateAuctioneerLine();
    this.aiLoading = false;
  }
}
