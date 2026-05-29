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
        const remoteSignature = this.signature(remoteState);
        if (remoteSignature === this.lastSyncedSignature) return;
        this.applyingRemote = true;
        this.store.applyRemoteState(remoteState);
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
      this.lastSyncedSignature = signature;
      setDoc(
        this.roomRef,
        {
          updatedAt: Date.now(),
          state: this.toFirestoreState(state),
        },
        { merge: true },
      ).catch((error: Error) => {
        this.lastError.set(error.message);
        this.status.set('Firebase sync error');
      });
    });
  }

  destroy(): void {
    this.unsubscribe?.();
  }

  private signature(state: AuctionState): string {
    const { countdown, goingStage, ...stableState } = state;
    return JSON.stringify(stableState);
  }

  private toFirestoreState(state: AuctionState): AuctionState {
    return JSON.parse(JSON.stringify(state)) as AuctionState;
  }
}
