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
    const otherTeam = store.state().franchises[1];
    const player = store.currentPlayer();

    expect(store.bid(team.id)).toBeNull();
    expect(store.currentPlayer()?.id).toBe(player?.id);
    expect(store.pass(otherTeam.id)).toBeNull();

    const soldPlayer = store.state().players.find((item) => item.id === player?.id);
    const updatedTeam = store.state().franchises.find((item) => item.id === team.id);

    expect(soldPlayer?.status).toBe('sold');
    expect(soldPlayer?.soldTo).toBe(team.id);
    expect(updatedTeam?.playerIds).toContain(player?.id);
    expect(updatedTeam?.purseRemaining).toBeLessThan(120);
  });

  it('initializes every eligible franchise as active for a new player', () => {
    const teamIds = store.state().franchises.map((team) => team.id);

    expect(store.state().activeBidderIds).toEqual(teamIds);
    expect(store.state().passedBidderIds).toEqual([]);
    expect(store.state().highestBidderId).toBeNull();
    expect(store.state().currentBidAmount).toBe(store.currentPlayer()?.basePrice ?? 0);
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

  it('lets a franchise pass on the current player and blocks later bids for that player', () => {
    const team = store.state().franchises[0];

    expect(store.pass(team.id)).toBeNull();

    expect(store.hasPassed(team.id)).toBeTrue();
    expect(store.bid(team.id)).toContain('Team already passed on this player');
  });

  it('marks the player unsold when every franchise passes without a bid', () => {
    const player = store.currentPlayer();

    store.state().franchises.forEach((team) => {
      store.pass(team.id);
    });

    const passedPlayer = store.state().players.find((item) => item.id === player?.id);
    expect(passedPlayer?.status).toBe('unsold');
    expect(store.state().currentPassTeamIds).toEqual([]);
  });

  it('keeps a passed franchise out of the bidding until the next player starts', () => {
    const team = store.state().franchises[0];
    const otherTeam = store.state().franchises[1];

    expect(store.pass(team.id)).toBeNull();
    expect(store.bid(team.id)).toContain('Team already passed on this player');
    expect(store.bid(otherTeam.id)).toBeNull();

    expect(store.state().players.find((item) => item.id === store.state().bidHistory[0].playerId)?.status).toBe('sold');
    expect(store.state().activeBidderIds).toEqual([]);
  });

  it('uses the latest bid as source of truth when derived bidder state is stale', () => {
    const dhoniSuperKings = store.state().franchises[0];
    const mumbaiLegends = store.state().franchises[1];

    expect(store.bid(dhoniSuperKings.id)).toBeNull();
    expect(store.bid(mumbaiLegends.id)).toBeNull();

    (store as unknown as { stateSignal: { update: (updater: (state: ReturnType<AuctionStore['state']>) => ReturnType<AuctionStore['state']>) => void } }).stateSignal.update((state) => ({
      ...state,
      highestBidderId: dhoniSuperKings.id,
      currentBidAmount: 2,
    }));

    expect(store.passErrorFor(dhoniSuperKings)).toBeNull();
    expect(store.bid(dhoniSuperKings.id)).toBeNull();
    expect(store.state().currentBid?.amount).toBe(3);
  });
});
