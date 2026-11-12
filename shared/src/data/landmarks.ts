import type { Landmark } from '../types';

/** Illustrative campus landmarks for local builds; coordinates are diagram positions, not GPS. */
export const landmarks: Landmark[] = [
  { id: 'gate', name: 'Main Gate', x: 12, y: 82, kind: 'gate' },
  { id: 'library', name: 'University Library', x: 42, y: 42, kind: 'study' },
  { id: 'lecture-hall', name: 'Lecture Hall 1', x: 66, y: 18, kind: 'class' },
  { id: 'hostel', name: 'Student Hostel A', x: 82, y: 66, kind: 'hostel' },
  { id: 'cafeteria', name: 'Cafeteria', x: 28, y: 68, kind: 'food' },
  { id: 'trading-centre', name: 'Trading Centre', x: 10, y: 24, kind: 'shops' },
  { id: 'off-campus-lodge', name: 'Off-campus Lodge', x: 90, y: 90, kind: 'lodging' },
];
export const findLandmark = (id: string) => landmarks.find(item => item.id === id);
