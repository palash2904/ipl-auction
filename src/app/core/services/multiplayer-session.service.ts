import { Injectable, inject, signal } from '@angular/core';
import { Auth, getAuth, signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  Firestore,
  getFirestore,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { RoomMember } from '../../models/multiplayer.models';
import { FirebaseAppService } from './firebase-app.service';

const SESSION_KEY = 'ipl-legends-room-member';

@Injectable({ providedIn: 'root' })
export class MultiplayerSessionService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly app = this.firebase.app;
  private readonly db: Firestore | null = this.app ? getFirestore(this.app) : null;
  private readonly auth: Auth | null = this.app ? getAuth(this.app) : null;
  private unsubscribe?: Unsubscribe;

  readonly currentMember = signal<RoomMember | null>(this.loadLocalMember());
  readonly members = signal<RoomMember[]>([]);
  readonly status = signal('Choose your team');
  readonly error = signal('');

  constructor() {
    if (!this.db) return;
    const membersRef = collection(this.db, 'auctionRooms', environment.firebase.roomId, 'members');
    this.unsubscribe = onSnapshot(
      membersRef,
      (snapshot) => {
        this.members.set(snapshot.docs.map((item) => item.data() as RoomMember));
      },
      (error) => this.error.set(error.message),
    );
  }

  async join(displayName: string, teamId: string): Promise<void> {
    const member: RoomMember = {
      uid: await this.resolveUid(),
      displayName: displayName.trim() || 'Team Owner',
      role: 'owner',
      teamId,
      joinedAt: Date.now(),
    };

    this.currentMember.set(member);
    localStorage.setItem(SESSION_KEY, JSON.stringify(member));
    this.status.set(`${member.displayName} joined as team owner`);

    if (this.db) {
      await setDoc(
        doc(this.db, 'auctionRooms', environment.firebase.roomId, 'members', member.uid),
        member,
        { merge: true },
      );
    }
  }

  leave(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentMember.set(null);
    this.status.set('Choose your team');
  }

  async clearConnectedMembers(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    this.currentMember.set(null);
    this.members.set([]);
    this.status.set('Room members cleared');

    if (!this.db) return;
    const membersRef = collection(this.db, 'auctionRooms', environment.firebase.roomId, 'members');
    const snapshot = await getDocs(membersRef);
    const batch = writeBatch(this.db);
    snapshot.docs.forEach((member) => batch.delete(member.ref));
    await batch.commit();
  }

  canBid(teamId: string): boolean {
    const member = this.currentMember();
    return !!member && member.teamId === teamId;
  }

  canControlAuction(): boolean {
    return !!this.currentMember();
  }

  isTeamClaimed(teamId: string): boolean {
    const currentUid = this.currentMember()?.uid;
    return this.members().some(
      (member) => member.role === 'owner' && member.teamId === teamId && member.uid !== currentUid,
    );
  }

  destroy(): void {
    this.unsubscribe?.();
  }

  private async resolveUid(): Promise<string> {
    if (!this.auth) return this.currentMember()?.uid ?? crypto.randomUUID();
    const existing = this.auth.currentUser;
    if (existing) return existing.uid;
    try {
      const credential = await signInAnonymously(this.auth);
      return credential.user.uid;
    } catch {
      return this.currentMember()?.uid ?? crypto.randomUUID();
    }
  }

  private loadLocalMember(): RoomMember | null {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as RoomMember;
    } catch {
      return null;
    }
  }
}
