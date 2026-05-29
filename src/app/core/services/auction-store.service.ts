import { computed, effect, Injectable, signal } from '@angular/core';
import { AUCTION_PLAYERS } from '../../features/auction/data/players.data';
import {
  AuctionLogEntry,
  AuctionState,
  Bid,
  Franchise,
  Player,
  TeamFormValue,
} from '../../models/auction.models';

const STARTING_PURSE = 120;
const STORAGE_KEY = 'ipl-legends-auction-state';

const initialState = (): AuctionState => ({
  franchises: [],
  players: structuredClone(AUCTION_PLAYERS),
  currentPlayerId: null,
  currentBid: null,
  bidHistory: [],
  auctionLog: [],
  phase: 'setup',
  paused: false,
  countdown: 0,
  goingStage: 0,
  accelerated: false,
});

@Injectable({ providedIn: 'root' })
export class AuctionStore {
  private readonly stateSignal = signal<AuctionState>(this.loadState());
  private lastBidSnapshot: AuctionState | null = null;

  readonly state = this.stateSignal.asReadonly();
  readonly currentPlayer = computed(() =>
    this.state().players.find((player) => player.id === this.state().currentPlayerId) ?? null,
  );
  readonly soldPlayers = computed(() => this.state().players.filter((player) => player.status === 'sold'));
  readonly unsoldPlayers = computed(() => this.state().players.filter((player) => player.status === 'unsold'));
  readonly availablePlayers = computed(() =>
    this.state().players.filter((player) => player.status === 'available'),
  );
  readonly currentSetTitle = computed(() => {
    const player = this.currentPlayer();
    return player ? `SET ${player.setNumber}` : 'Auction Complete';
  });

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stateSignal()));
    });
  }

  setupAuction(teams: TeamFormValue[]): void {
    const franchises = teams.map((team, index): Franchise => ({
      id: crypto.randomUUID(),
      ownerName: team.ownerName.trim(),
      franchiseName: team.franchiseName.trim(),
      logoEmoji: team.logoEmoji.trim() || '🏏',
      startingPurse: STARTING_PURSE,
      purseRemaining: STARTING_PURSE,
      overseasSlotsMax: 8,
      maxSquadSize: 25,
      playerIds: [],
    }));
    const players = structuredClone(AUCTION_PLAYERS);
    const currentPlayerId = players[0]?.id ?? null;
    this.stateSignal.set({
      ...initialState(),
      franchises,
      players,
      currentPlayerId,
      phase: 'live',
      auctionLog: [this.log(`Auction started with ${franchises.length} franchises`)],
    });
  }

  bid(teamId: string): string | null {
    const state = this.state();
    const player = this.currentPlayer();
    const team = state.franchises.find((item) => item.id === teamId);
    if (!player || !team) return 'No active player selected.';
    const error = this.validateBid(team, player);
    if (error) return error;
    const amount = this.nextBidAmount(state.currentBid?.amount ?? player.basePrice - this.incrementFor(player.basePrice));
    if (team.purseRemaining < amount) return `${team.franchiseName} needs ${this.money(amount)} available.`;

    this.lastBidSnapshot = structuredClone(state);
    const bid: Bid = {
      id: crypto.randomUUID(),
      playerId: player.id,
      teamId: team.id,
      teamName: team.franchiseName,
      amount,
      createdAt: Date.now(),
    };
    this.stateSignal.update((current) => ({
      ...current,
      currentBid: bid,
      bidHistory: [bid, ...current.bidHistory],
      goingStage: 0,
      auctionLog: [this.log(`${team.franchiseName} bids ${this.money(amount)} for ${player.name}`), ...current.auctionLog],
    }));
    this.playTone(720, 0.08);
    return null;
  }

  markUnsold(): void {
    const player = this.currentPlayer();
    if (!player || player.status !== 'available') return;
    this.stateSignal.update((state) => ({
      ...state,
      players: state.players.map((item) =>
        item.id === player.id ? { ...item, status: 'unsold', soldTo: null, soldPrice: 0 } : item,
      ),
      currentBid: null,
      goingStage: 0,
      auctionLog: [this.log(`${player.name} goes unsold`), ...state.auctionLog],
    }));
    this.nextPlayer();
  }

  sellCurrentPlayer(): void {
    const state = this.state();
    const player = this.currentPlayer();
    const bid = state.currentBid;
    if (!player || !bid || player.status !== 'available') return;

    this.stateSignal.update((current) => ({
      ...current,
      players: current.players.map((item) =>
        item.id === player.id
          ? { ...item, status: 'sold', soldTo: bid.teamId, soldPrice: bid.amount }
          : item,
      ),
      franchises: current.franchises.map((team) =>
        team.id === bid.teamId
          ? {
              ...team,
              purseRemaining: Number((team.purseRemaining - bid.amount).toFixed(2)),
              playerIds: [...team.playerIds, player.id],
            }
          : team,
      ),
      currentBid: null,
      goingStage: 0,
      auctionLog: [this.log(`SOLD: ${player.name} to ${bid.teamName} for ${this.money(bid.amount)}`), ...current.auctionLog],
    }));
    this.playTone(260, 0.14);
    setTimeout(() => this.nextPlayer(), 900);
  }

  nextPlayer(): void {
    this.stateSignal.update((state) => {
      const next = state.players.find((player) => player.status === 'available' && player.id !== state.currentPlayerId);
      return {
        ...state,
        currentPlayerId: next?.id ?? null,
        phase: next ? state.phase : 'complete',
        currentBid: null,
        goingStage: 0,
      };
    });
  }

  selectPlayer(playerId: string): void {
    const player = this.state().players.find((item) => item.id === playerId && item.status === 'available');
    if (!player) return;
    this.stateSignal.update((state) => ({
      ...state,
      currentPlayerId: player.id,
      currentBid: null,
      goingStage: 0,
    }));
  }

  startReauction(): void {
    const unsoldIds = new Set(this.unsoldPlayers().map((player) => player.id));
    this.stateSignal.update((state) => ({
      ...state,
      phase: 'reauction',
      players: state.players.map((player) =>
        unsoldIds.has(player.id) ? { ...player, status: 'available' } : player,
      ),
      currentPlayerId: [...unsoldIds][0] ?? state.currentPlayerId,
      currentBid: null,
      auctionLog: [this.log('Re-auction phase opened for unsold players'), ...state.auctionLog],
    }));
  }

  toggleAccelerated(): void {
    this.stateSignal.update((state) => ({
      ...state,
      accelerated: !state.accelerated,
      phase: !state.accelerated ? 'accelerated' : 'live',
      auctionLog: [
        this.log(!state.accelerated ? 'Accelerated auction phase enabled' : 'Standard auction phase resumed'),
        ...state.auctionLog,
      ],
    }));
  }

  togglePause(): void {
    this.stateSignal.update((state) => ({
      ...state,
      paused: !state.paused,
      auctionLog: [this.log(!state.paused ? 'Auction paused' : 'Auction resumed'), ...state.auctionLog],
    }));
  }

  undoLastBid(): void {
    if (!this.lastBidSnapshot) return;
    this.stateSignal.set({
      ...this.lastBidSnapshot,
      auctionLog: [this.log('Last bid undone'), ...this.lastBidSnapshot.auctionLog],
    });
    this.lastBidSnapshot = null;
  }

  saveState(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
  }

  loadSavedState(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    this.stateSignal.set(JSON.parse(saved) as AuctionState);
    return true;
  }

  resetAuction(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.stateSignal.set(initialState());
  }

  applyRemoteState(state: AuctionState): void {
    this.stateSignal.set(state);
  }

  exportSquads(): void {
    window.print();
  }

  playersForTeam(teamId: string): Player[] {
    const team = this.state().franchises.find((item) => item.id === teamId);
    if (!team) return [];
    const ids = new Set(team.playerIds);
    return this.state().players.filter((player) => ids.has(player.id));
  }

  overseasUsed(teamId: string): number {
    return this.playersForTeam(teamId).filter((player) => player.overseas).length;
  }

  totalSpent(team: Franchise): number {
    return Number((team.startingPurse - team.purseRemaining).toFixed(2));
  }

  bidErrorFor(team: Franchise): string | null {
    const player = this.currentPlayer();
    return player ? this.validateBid(team, player) : 'Auction complete.';
  }

  nextBidAmount(current: number): number {
    return Number((current + this.incrementFor(current)).toFixed(2));
  }

  private validateBid(team: Franchise, player: Player): string | null {
    if (player.status !== 'available') return 'Player is no longer available.';
    if (team.playerIds.length >= team.maxSquadSize) return 'Squad already has 25 players.';
    if (player.overseas && this.overseasUsed(team.id) >= team.overseasSlotsMax) return 'Overseas slots are full.';
    const next = this.nextBidAmount(this.state().currentBid?.amount ?? player.basePrice - this.incrementFor(player.basePrice));
    if (team.purseRemaining < next) return 'Purse insufficient for next bid.';
    return null;
  }

  private incrementFor(amount: number): number {
    if (amount > 15) return 2;
    if (amount > 5) return 1;
    if (amount >= 2) return 0.5;
    return 0.25;
  }

  private loadState(): AuctionState {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState();
    try {
      return JSON.parse(saved) as AuctionState;
    } catch {
      return initialState();
    }
  }

  private log(message: string): AuctionLogEntry {
    return { id: crypto.randomUUID(), message, createdAt: Date.now() };
  }

  private money(amount: number): string {
    return `Rs ${amount.toFixed(amount % 1 === 0 ? 0 : 2)} Cr`;
  }

  private playTone(frequency: number, duration: number): void {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }
}
