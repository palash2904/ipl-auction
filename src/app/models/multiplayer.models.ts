export interface RoomMember {
  uid: string;
  displayName: string;
  role: 'owner';
  teamId: string | null;
  joinedAt: number;
}
