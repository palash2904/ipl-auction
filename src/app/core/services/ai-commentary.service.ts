import { Injectable, inject } from '@angular/core';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { environment } from '../../../environments/environment';
import { AuctionStore } from './auction-store.service';
import { FirebaseAppService } from './firebase-app.service';

@Injectable({ providedIn: 'root' })
export class AiCommentaryService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly store = inject(AuctionStore);

  readonly enabled = this.firebase.enabled && environment.firebase.aiEnabled;

  async generateAuctioneerLine(): Promise<string> {
    const player = this.store.currentPlayer();
    const state = this.store.state();
    const app = this.firebase.app;

    if (!this.enabled || !app || !player) {
      return this.localCommentary();
    }

    const leadingBid = state.currentBid
      ? `${state.currentBid.teamName} leads at Rs ${state.currentBid.amount} Cr`
      : 'no bids yet';
    const teams = state.franchises
      .map((team) => `${team.franchiseName}: Rs ${team.purseRemaining} Cr left, ${team.playerIds.length}/25 players`)
      .join('; ');

    const prompt = [
      'You are an energetic IPL live auction commentator.',
      'Write one energetic, TV-style auction commentary line under 28 words.',
      'Do not mention that you are AI.',
      `Player: ${player.name}, role: ${player.role}, nationality: ${player.nationality}, base: Rs ${player.basePrice} Cr.`,
      `Current bid: ${leadingBid}.`,
      `Teams: ${teams}.`,
    ].join('\n');

    try {
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, { model: environment.firebase.aiModel });
      const result = await model.generateContent(prompt);
      return result.response.text().trim() || this.localCommentary();
    } catch (error) {
      console.warn('Commentary failed', error);
      return this.localCommentary();
    }
  }

  private localCommentary(): string {
    const player = this.store.currentPlayer();
    const bid = this.store.state().currentBid;
    if (!player) return 'The auction room is settled. All eyes move to the final squad sheets.';
    if (bid) return `${bid.teamName} holds the paddle high for ${player.name} at Rs ${bid.amount} Cr.`;
    return `${player.name} is on the block. Base price set, paddles ready, room watching closely.`;
  }
}
