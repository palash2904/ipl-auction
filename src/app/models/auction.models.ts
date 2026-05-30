export type PlayerStatus = 'available' | 'sold' | 'unsold';
export type AuctionPhase = 'setup' | 'live' | 'accelerated' | 'reauction' | 'complete';

export interface PlayerStats {
  matches?: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
}

export interface Player {
  id: string;
  name: string;
  role: string;
  nationality: string;
  overseas: boolean;
  basePrice: number;
  soldPrice: number;
  soldTo: string | null;
  status: PlayerStatus;
  setNumber: number;
  image: string;
  stats?: PlayerStats;
}

export interface AuctionSet {
  setNumber: number;
  title: string;
  players: Player[];
}

export interface Franchise {
  id: string;
  ownerName: string;
  franchiseName: string;
  logoEmoji: string;
  startingPurse: number;
  purseRemaining: number;
  overseasSlotsMax: number;
  maxSquadSize: number;
  playerIds: string[];
}

export interface Bid {
  id: string;
  playerId: string;
  teamId: string;
  teamName: string;
  amount: number;
  createdAt: number;
}

export interface AuctionLogEntry {
  id: string;
  message: string;
  createdAt: number;
}

export interface AuctionState {
  franchises: Franchise[];
  players: Player[];
  currentPlayerId: string | null;
  currentBid: Bid | null;
  activeBidderIds: string[];
  passedBidderIds: string[];
  highestBidderId: string | null;
  currentBidAmount: number;
  currentPassTeamIds: string[];
  bidHistory: Bid[];
  auctionLog: AuctionLogEntry[];
  phase: AuctionPhase;
  paused: boolean;
  countdown: number;
  goingStage: 0 | 1 | 2;
  accelerated: boolean;
}

export interface TeamFormValue {
  ownerName: string;
  franchiseName: string;
  logoEmoji: string;
}
