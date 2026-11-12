import { randomUUID } from 'node:crypto';
import { db } from '../db/database.js';
import { landmarks } from '../domain/landmarks.js';
import { publicUser, toIso } from '../domain/serializers.js';

const participantRows=db.prepare(`SELECT p.*,u.name FROM walk_participants p JOIN users u ON u.id=p.user_id WHERE p.walk_id=? ORDER BY p.joined_at`);
export function getWalk(walkId) {
  const w=db.prepare('SELECT * FROM walks WHERE id=?').get(walkId);if(!w)return null;
  const participants=participantRows.all(walkId).map(p=>({userId:p.user_id,name:p.name,joinedAt:toIso(p.joined_at),sharingEnabled:!!p.sharing_enabled,status:p.status}));
  return {id:w.id,ownerId:w.owner_id,originId:w.origin_id,destinationId:w.destination_id,status:w.status,sharingEnabled:!!(participants.find(p=>p.userId===w.owner_id)?.sharingEnabled),createdAt:toIso(w.created_at),endedAt:toIso(w.ended_at),participants};
}
export function activeWalkFor(userId) {
  const row=db.prepare(`SELECT w.id FROM walks w JOIN walk_participants p ON p.walk_id=w.id WHERE p.user_id=? AND p.status='joined' AND w.status='active' ORDER BY w.created_at DESC LIMIT 1`).get(userId);
  return row?getWalk(row.id):null;
}
export function hasMembership(userId,walkId) { return !!db.prepare("SELECT 1 FROM walk_participants p JOIN walks w ON w.id=p.walk_id WHERE p.user_id=? AND p.walk_id=? AND p.status='joined'").get(userId,walkId); }
export function createWalk({ownerId,originId,destinationId,inviteUserIds,sharingEnabled}) {
  if(!landmarks.has(originId)||!landmarks.has(destinationId)||originId===destinationId)throw Object.assign(new Error('Choose two different campus landmarks.'),{status:400});
  if(activeWalkFor(ownerId))throw Object.assign(new Error('End your current walk before starting another.'),{status:409});
  const unique=[...new Set(inviteUserIds)];
  const checkFriend=db.prepare('SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?');
  const invitePreference=db.prepare('SELECT invitations FROM settings WHERE user_id=?');
  for(const id of unique){
    if(!checkFriend.get(ownerId,id))throw Object.assign(new Error('Walk invitations can only go to accepted friends.'),{status:403});
    if(invitePreference.get(id)?.invitations==='none')throw Object.assign(new Error('A friend has turned off walk invitations.'),{status:403});
  }
  const id=randomUUID();
  const create=db.transaction(()=>{
    db.prepare('INSERT INTO walks(id,owner_id,origin_id,destination_id) VALUES(?,?,?,?)').run(id,ownerId,originId,destinationId);
    db.prepare('INSERT INTO walk_participants(walk_id,user_id,sharing_enabled) VALUES(?,?,?)').run(id,ownerId,sharingEnabled?1:0);
    for(const recipient of unique){
      const inviteId=randomUUID();db.prepare('INSERT INTO invitations(id,walk_id,sender_id,recipient_id) VALUES(?,?,?,?)').run(inviteId,id,ownerId,recipient);
      notify(recipient,'walk_invitation','A friend invited you to join a walk.');
    }
    notify(ownerId,'walk_started',`Your walk to ${landmarks.get(destinationId).name} has started.`);
  });create();return getWalk(id);
}
export function notify(userId,kind,body) {
  const settings=db.prepare('SELECT notifications_enabled FROM settings WHERE user_id=?').get(userId);
  if(settings&&!settings.notifications_enabled)return;
  db.prepare('INSERT INTO notifications(id,user_id,kind,body) VALUES(?,?,?,?)').run(randomUUID(),userId,kind,body);
}
export function formatInvitation(row) {
  const sender=db.prepare('SELECT id,name,email,student_id,availability FROM users WHERE id=?').get(row.sender_id);
  const walk=db.prepare('SELECT origin_id,destination_id FROM walks WHERE id=?').get(row.walk_id);
  return {id:row.id,walkId:row.walk_id,sender:publicUser(sender),originId:walk.origin_id,destinationId:walk.destination_id,createdAt:toIso(row.created_at),status:row.status};
}
export { landmarks };
