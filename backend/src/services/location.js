import { randomUUID } from 'node:crypto';
import { db } from '../db/database.js';
import { emitToWalk } from './realtime.js';

const FIX_TTL_SECONDS = 90;
const ARRIVAL_GRACE_MINUTES = 10;

function validPoint(point) {
  return Number.isFinite(point?.latitude) && point.latitude >= -90 && point.latitude <= 90
    && Number.isFinite(point?.longitude) && point.longitude >= -180 && point.longitude <= 180;
}

/** Keeps only coarse, short-lived location fixes and enforces active consent server-side. */
export const locationService = {
  publish(walkId, userId, fix) {
    if (!validPoint(fix)) throw Object.assign(new Error('A valid location is required.'), { status: 400 });
    const walk = db.prepare("SELECT id,status,location_sharing_ends_at FROM walks WHERE id=?").get(walkId);
    const participant = db.prepare("SELECT status,sharing_enabled FROM walk_participants WHERE walk_id=? AND user_id=?").get(walkId, userId);
    if (!walk || walk.status !== 'active' || !participant || participant.status !== 'joined') {
      throw Object.assign(new Error('An active walk membership is required.'), { status: 403 });
    }
    if (!participant.sharing_enabled) throw Object.assign(new Error('Turn on location sharing for this walk first.'), { status: 403 });
    if (walk.location_sharing_ends_at && Date.parse(walk.location_sharing_ends_at) <= Date.now()) {
      db.prepare('UPDATE walk_participants SET sharing_enabled=0 WHERE walk_id=?').run(walkId);
      db.prepare('DELETE FROM location_updates WHERE walk_id=?').run(walkId);
      throw Object.assign(new Error('Location sharing ended after the arrival grace period.'), { status: 410 });
    }

    // Three decimal places keep only an approximate campus pin (~100 m); exact fixes are not persisted.
    const latitude = Math.round(fix.latitude * 1000) / 1000;
    const longitude = Math.round(fix.longitude * 1000) / 1000;
    const capturedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + FIX_TTL_SECONDS * 1000).toISOString();
    db.transaction(() => {
      db.prepare('DELETE FROM location_updates WHERE expires_at<=?').run(capturedAt);
      db.prepare('DELETE FROM location_updates WHERE walk_id=? AND user_id=?').run(walkId, userId);
      db.prepare('INSERT INTO location_updates(id,walk_id,user_id,latitude,longitude,accuracy_meters,captured_at,expires_at) VALUES(?,?,?,?,?,?,?,?)')
        .run(randomUUID(), walkId, userId, latitude, longitude, null, capturedAt, expiresAt);
    })();
    emitToWalk(walkId, 'location:changed', { walkId });
    return { latitude, longitude, capturedAt, expiresAt, approximate: true };
  },

  currentForWalk(walkId) {
    const rows = db.prepare(`SELECT l.user_id,l.latitude,l.longitude,l.captured_at,l.expires_at,u.name
      FROM location_updates l JOIN users u ON u.id=l.user_id
      JOIN walk_participants p ON p.walk_id=l.walk_id AND p.user_id=l.user_id
      WHERE l.walk_id=? AND l.expires_at>? AND p.status='joined' AND p.sharing_enabled=1
      ORDER BY l.captured_at DESC`).all(walkId, new Date().toISOString());
    const latestByUser = new Map();
    for (const row of rows) if (!latestByUser.has(row.user_id)) latestByUser.set(row.user_id, {
      userId: row.user_id, name: row.name, latitude: row.latitude, longitude: row.longitude,
      capturedAt: row.captured_at, expiresAt: row.expires_at, approximate: true,
    });
    return [...latestByUser.values()];
  },

  markArrived(walkId, userId) {
    const member = db.prepare("SELECT 1 FROM walks w JOIN walk_participants p ON p.walk_id=w.id WHERE w.id=? AND w.status='active' AND p.user_id=? AND p.status='joined'").get(walkId, userId);
    if (!member) throw Object.assign(new Error('An active walk membership is required.'), { status: 403 });
    const arrivedAt = new Date();
    const stopAt = new Date(arrivedAt.getTime() + ARRIVAL_GRACE_MINUTES * 60_000);
    db.prepare('UPDATE walks SET arrived_at=?,location_sharing_ends_at=? WHERE id=?').run(arrivedAt.toISOString(), stopAt.toISOString(), walkId);
    emitToWalk(walkId, 'walk:updated', { id: walkId, arrivedAt: arrivedAt.toISOString(), locationSharingEndsAt: stopAt.toISOString() });
    return { arrivedAt: arrivedAt.toISOString(), sharingEndsAt: stopAt.toISOString(), graceMinutes: ARRIVAL_GRACE_MINUTES };
  },

  stopForParticipant(walkId, userId) {
    db.prepare('DELETE FROM location_updates WHERE walk_id=? AND user_id=?').run(walkId, userId);
  },

  stopForWalk(walkId) {
    db.prepare('DELETE FROM location_updates WHERE walk_id=?').run(walkId);
  },

  cleanupExpired() {
    const due = db.prepare("SELECT id FROM walks WHERE status='active' AND location_sharing_ends_at IS NOT NULL AND location_sharing_ends_at<=?").all(new Date().toISOString());
    const expire = db.transaction(() => {
      for (const { id } of due) {
        db.prepare('UPDATE walk_participants SET sharing_enabled=0 WHERE walk_id=?').run(id);
        this.stopForWalk(id);
        db.prepare('UPDATE walks SET location_sharing_ends_at=NULL WHERE id=?').run(id);
      }
      db.prepare('DELETE FROM location_updates WHERE expires_at<=?').run(new Date().toISOString());
    });
    expire();
    return due.length;
  },
};

export const locationPolicy = { fixTtlSeconds: FIX_TTL_SECONDS, arrivalGraceMinutes: ARRIVAL_GRACE_MINUTES };
