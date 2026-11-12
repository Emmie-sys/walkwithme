export type User = { id: string; name: string; email: string; studentId?: string; availability: string };
export type Landmark = { id: string; name: string; x: number; y: number; kind: string };
export type Walk = { id: string; ownerId: string; ownerName: string; originId: string; destinationId: string; status: 'active'|'completed'|'cancelled'; sharingEnabled: boolean; createdAt: string; endedAt?: string; participants: Participant[]; messages?: Message[] };
export type Participant = { userId: string; name: string; joinedAt: string; sharingEnabled: boolean; area?: { x: number; y: number }; status: 'joined'|'left' };
export type Message = { id: string; walkId: string; userId: string; name: string; body: string; createdAt: string };
export type Invitation = { id: string; walkId: string; sender: User; originId: string; destinationId: string; createdAt: string; status: string };
export type Notice = { id: string; body: string; kind: string; createdAt: string; readAt?: string };
export type Settings = { shareByDefault: boolean; approximateAreas: boolean; notificationsEnabled: boolean; invitations: 'friends'|'none' };
