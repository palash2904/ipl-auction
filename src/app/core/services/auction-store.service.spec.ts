import { TestBed } from '@angular/core/testing';
import { AuctionStore } from './auction-store.service';

const teams = [
  { ownerName: 'Ananya', franchiseName: 'Dhoni Super Kings', logoEmoji: '\u{1F981}' },
  { ownerName: 'Rohan', franchiseName: 'Mumbai Legends', logoEmoji: '\u{1F499}' },
];

describe('AuctionStore', () => {
  let store: AuctionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(AuctionStore);
    (store as unknown as { playTone: () => void }).playTone = () => undefined;
    store.setupAuction(teams);
  });

  afterEach(() => {
    store.resetAuction();
    localStorage.clear();
  });

  it('creates franchises with IPL auction constraints', () => {
    const franchise = store.state().franchises[0];
    expect(store.state().franchises.length).toBe(2);
    expect(franchise.startingPurse).toBe(120);
    expect(franchise.overseasSlotsMax).toBe(8);
    expect(franchise.maxSquadSize).toBe(25);
  });

  it('calculates bid increments by current price band', () => {
    expect(store.nextBidAmount(1.5)).toBe(1.75);
    expect(store.nextBidAmount(2)).toBe(2.5);
    expect(store.nextBidAmount(5.5)).toBe(6.5);
    expect(store.nextBidAmount(16)).toBe(18);
  });

  it('records a bid and sells the player to the winning franchise', () => {
    const team = store.state().franchises[0];
    const player = store.currentPlayer();

    expect(store.bid(team.id)).toBeNull();
    store.sellCurrentPlayer();

    const soldPlayer = store.state().players.find((item) => item.id === player?.id);
    const updatedTeam = store.state().franchises.find((item) => item.id === team.id);

    expect(soldPlayer?.status).toBe('sold');
    expect(soldPlayer?.soldTo).toBe(team.id);
    expect(updatedTeam?.playerIds).toContain(player?.id);
    expect(updatedTeam?.purseRemaining).toBeLessThan(120);
  });

  it('prevents bidding when a squad is full', () => {
    const team = store.state().franchises[0];
    (store as unknown as { stateSignal: { update: (updater: (state: ReturnType<AuctionStore['state']>) => ReturnType<AuctionStore['state']>) => void } }).stateSignal.update((state) => ({
      ...state,
      franchises: state.franchises.map((item) =>
        item.id === team.id ? { ...item, playerIds: Array.from({ length: 25 }, (_, index) => `p-${index}`) } : item,
      ),
    }));

    expect(store.bid(team.id)).toContain('Squad already has 25 players');
  });
});
