import { effect, Injectable, inject, signal } from '@angular/core';
import { doc, Firestore, getFirestore, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { AuctionState } from '../../models/auction.models';
import { AuctionStore } from './auction-store.service';
import { FirebaseAppService } from './firebase-app.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuctionSyncService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly store = inject(AuctionStore);
  private readonly db: Firestore | null = this.firebase.app ? getFirestore(this.firebase.app) : null;
  private readonly roomRef = this.db ? doc(this.db, 'auctionRooms', environment.firebase.roomId) : null;
  private unsubscribe?: Unsubscribe;
  private applyingRemote = false;
  private lastSyncedSignature = '';
  private pendingWrite: AuctionState | null = null;
  private pendingWriteSignature = '';
  private writeInFlight = false;
  private writeTimer?: ReturnType<typeof setTimeout>;

  readonly enabled = this.firebase.enabled;
  readonly connected = signal(false);
  readonly status = signal(this.enabled ? 'Connecting to Firebase...' : 'Local mode');
  readonly lastError = signal('');

  constructor() {
    if (!this.roomRef) return;

    this.unsubscribe = onSnapshot(
      this.roomRef,
      (snapshot) => {
        this.connected.set(true);
        this.status.set('Firebase realtime sync active');
        const remoteState = snapshot.data()?.['state'] as AuctionState | undefined;
        if (!remoteState) return;
        const normalizedRemoteState = this.normalizeState(remoteState);
        const remoteSignature = this.signature(normalizedRemoteState);
        if (remoteSignature === this.lastSyncedSignature) return;
        this.applyingRemote = true;
        this.store.applyRemoteState(normalizedRemoteState);
        this.lastSyncedSignature = remoteSignature;
        queueMicrotask(() => (this.applyingRemote = false));
      },
      (error) => {
        this.connected.set(false);
        this.lastError.set(error.message);
        this.status.set('Firebase sync error');
      },
    );

    effect(() => {
      const state = this.store.state();
      if (this.applyingRemote || !this.roomRef) return;
      const signature = this.signature(state);
      if (signature === this.lastSyncedSignature) return;
      this.scheduleWrite(state, signature);
    });
  }

  destroy(): void {
    this.unsubscribe?.();
    if (this.writeTimer) clearTimeout(this.writeTimer);
  }

  private scheduleWrite(state: AuctionState, signature: string): void {
    this.pendingWrite = this.toFirestoreState(state);
    this.pendingWriteSignature = signature;
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => {
      this.writeTimer = undefined;
      void this.flushWrite();
    }, 250);
  }

  private async flushWrite(): Promise<void> {
    if (this.writeInFlight || !this.roomRef || !this.pendingWrite) return;

    const state = this.pendingWrite;
    const signature = this.pendingWriteSignature;
    this.pendingWrite = null;
    this.pendingWriteSignature = '';
    this.writeInFlight = true;

    try {
      await setDoc(
        this.roomRef,
        {
          updatedAt: Date.now(),
          state,
        },
        { merge: true },
      );
      this.lastSyncedSignature = signature;
      this.lastError.set('');
      this.status.set('Firebase realtime sync active');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Firebase sync error';
      this.lastError.set(message);
      this.status.set('Firebase sync error');
      this.pendingWrite = state;
      this.pendingWriteSignature = signature;
      if (!this.writeTimer) {
        this.writeTimer = setTimeout(() => {
          this.writeTimer = undefined;
          void this.flushWrite();
        }, 1500);
      }
    } finally {
      this.writeInFlight = false;
      if (this.pendingWrite && !this.writeTimer) {
        this.writeTimer = setTimeout(() => {
          this.writeTimer = undefined;
          void this.flushWrite();
        }, 250);
      }
    }
  }

  private signature(state: AuctionState): string {
    const { countdown, goingStage, ...stableState } = state;
    return JSON.stringify(stableState);
  }

  private toFirestoreState(state: AuctionState): AuctionState {
    return JSON.parse(JSON.stringify(state)) as AuctionState;
  }

  private normalizeState(state: AuctionState): AuctionState {
    return {
      ...state,
      activeBidderIds: state.activeBidderIds ?? [],
      passedBidderIds: state.passedBidderIds ?? state.currentPassTeamIds ?? [],
      highestBidderId: state.currentBid?.teamId ?? state.highestBidderId ?? null,
      currentBidAmount: state.currentBid?.amount ?? state.currentBidAmount ?? 0,
      currentPassTeamIds: state.currentPassTeamIds ?? [],
    };
  }
}
