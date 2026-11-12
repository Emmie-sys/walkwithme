import { randomUUID } from 'node:crypto';
import { db } from '../db/database.js';
import { localEmergencyProvider } from '../providers/emergency/localEmergencyProvider.js';

/** Safety routes depend on a provider contract instead of embedding dispatch behavior. */
export const safetyService={
  raiseSos(userId){return localEmergencyProvider.recordSos(userId);},
  checkIn(userId){return localEmergencyProvider.recordCheckIn(userId);},
  report(userId,body){const id=randomUUID();db.prepare('INSERT INTO safety_events(id,user_id,kind,body) VALUES(?,?,?,?)').run(id,userId,'report',body);return {id,recorded:true};},
};
