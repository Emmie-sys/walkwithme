import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt, randomUUID } from 'node:crypto';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notification, publicUser, toIso } from '../domain/serializers.js';
import { activeWalkFor, createWalk, formatInvitation, getWalk, hasMembership, landmarks, notify } from '../services/walks.js';
import { emitToUser, emitToWalk } from '../services/realtime.js';
import { safetyService } from '../services/safety.js';
import { identityService } from '../services/identity.js';
import { locationService } from '../services/location.js';
import { smsService } from '../services/sms.js';

export const api=Router();
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const send=(res,data,status=200)=>res.status(status).json({data});
const userByEmail=email=>db.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE').get(email);
const signIn=(row)=>({token:jwt.sign({sub:row.id},config.jwtSecret,{expiresIn:'8h'}),user:publicUser(row)});
const makeNotification=(id,kind,body)=>({id,kind,body,createdAt:toIso(new Date().toISOString()),readAt:undefined});

api.get('/health',(_req,res)=>send(res,{status:'ok',service:'walkwithme-api'}));
api.post('/auth/login',asyncRoute(async(req,res)=>{
  const email=String(req.body?.email??'').trim().toLowerCase(),password=String(req.body?.password??'');
  if(!config.demoLogin&&email.endsWith('@demo.gu.ac.ug'))return res.status(403).json({error:{message:'Demo accounts are disabled on this server.'}});
  const row=userByEmail(email);
  if(!row||!await bcrypt.compare(password,row.password_hash))return res.status(401).json({error:{message:'Email or password is not correct.'}});
  if(row.role==='admin')return res.status(403).json({error:{message:'Administrator accounts can sign in only through the Walk with Me Admin web app.'}});
  return send(res,signIn(row));
}));
api.post('/auth/register',asyncRoute(async(req,res)=>{
  const name=String(req.body?.name??'').trim(),email=String(req.body?.email??'').trim().toLowerCase(),studentId=String(req.body?.studentId??'').trim(),password=String(req.body?.password??'');
  if(name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||!studentId||password.length<10)return res.status(400).json({error:{message:'Enter your name, a valid email, student ID and a password of at least 10 characters.'}});
  if(!identityService.isUniversityEmailAllowed(email))return res.status(400).json({error:{message:`Use a university email address (${config.studentDomains.join(', ')}).`}});
  if(userByEmail(email))return res.status(409).json({error:{message:'An account already exists for that email.'}});
  const id=randomUUID(),hash=await bcrypt.hash(password,10);
  try{db.transaction(()=>{db.prepare('INSERT INTO users(id,name,email,student_id,password_hash) VALUES(?,?,?,?,?)').run(id,name,email,studentId,hash);db.prepare('INSERT INTO settings(user_id) VALUES(?)').run(id);})();}
  catch(error){if(String(error).includes('UNIQUE'))return res.status(409).json({error:{message:'An account already exists for that email.'}});throw error;}
  return send(res,signIn(db.prepare('SELECT * FROM users WHERE id=?').get(id)),201);
}));

api.use(requireAuth,requireRole('student'));
api.get('/me',(req,res)=>send(res,publicUser(req.user)));
api.get('/home',(req,res)=>{
  const friends=db.prepare('SELECT u.id,u.name,u.email,u.student_id,u.availability FROM friendships f JOIN users u ON u.id=f.friend_id WHERE f.user_id=? ORDER BY u.name').all(req.user.id).map(publicUser);
  const invitations=db.prepare("SELECT * FROM invitations WHERE recipient_id=? AND status='pending' ORDER BY created_at DESC").all(req.user.id).map(formatInvitation);
  const walks=db.prepare(`SELECT DISTINCT w.id FROM walks w JOIN walk_participants p ON p.walk_id=w.id WHERE p.user_id=? ORDER BY w.created_at DESC LIMIT 5`).all(req.user.id).map(row=>getWalk(row.id));
  return send(res,{friends,invitations,walks});
});
api.get('/students',(req,res)=>{
  const q=String(req.query.q??'').trim();if(q.length<2)return send(res,[]);
  const rows=db.prepare(`SELECT u.id,u.name,u.email,u.student_id,u.availability FROM users u WHERE u.id<>? AND (u.name LIKE ? OR u.email LIKE ?) AND NOT EXISTS(SELECT 1 FROM friendships f WHERE f.user_id=? AND f.friend_id=u.id) AND NOT EXISTS(SELECT 1 FROM friend_requests r WHERE r.status='pending' AND ((r.sender_id=u.id AND r.recipient_id=?) OR (r.sender_id=? AND r.recipient_id=u.id))) ORDER BY u.name LIMIT 20`).all(req.user.id,`%${q}%`,`%${q}%`,req.user.id,req.user.id,req.user.id);
  return send(res,rows.map(publicUser));
});
api.get('/friends',(req,res)=>{
  const friends=db.prepare('SELECT u.id,u.name,u.email,u.student_id,u.availability FROM friendships f JOIN users u ON u.id=f.friend_id WHERE f.user_id=? ORDER BY u.name').all(req.user.id).map(publicUser);
  const requests=db.prepare("SELECT r.id,r.created_at,u.id AS user_id,u.name,u.email FROM friend_requests r JOIN users u ON u.id=r.sender_id WHERE r.recipient_id=? AND r.status='pending' ORDER BY r.created_at DESC").all(req.user.id).map(r=>({id:r.id,user:{id:r.user_id,name:r.name,email:r.email},createdAt:toIso(r.created_at)}));
  return send(res,{friends,requests});
});
api.post('/friends/requests',(req,res)=>{
  const recipient=String(req.body?.userId??'');if(recipient===req.user.id||!db.prepare('SELECT 1 FROM users WHERE id=?').get(recipient))return res.status(404).json({error:{message:'Student not found.'}});
  if(db.prepare('SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?').get(req.user.id,recipient))return res.status(409).json({error:{message:'You are already friends.'}});
  const prior=db.prepare('SELECT * FROM friend_requests WHERE sender_id=? AND recipient_id=?').get(req.user.id,recipient);
  if(prior?.status==='pending')return res.status(409).json({error:{message:'Request is already pending.'}});
  if(prior)db.prepare("UPDATE friend_requests SET status='pending',created_at=CURRENT_TIMESTAMP WHERE id=?").run(prior.id);
  else db.prepare('INSERT INTO friend_requests(id,sender_id,recipient_id) VALUES(?,?,?)').run(randomUUID(),req.user.id,recipient);
  notify(recipient,'friend_request',`${req.user.name} sent you a friend request.`);emitToUser(recipient,'activity:changed',{kind:'friend_request'});return send(res,{sent:true},201);
});
api.post('/friends/requests/:id/accept',(req,res)=>{
  const request=db.prepare("SELECT * FROM friend_requests WHERE id=? AND recipient_id=? AND status='pending'").get(req.params.id,req.user.id);
  if(!request)return res.status(404).json({error:{message:'Pending request not found.'}});
  db.transaction(()=>{db.prepare("UPDATE friend_requests SET status='accepted' WHERE id=?").run(request.id);db.prepare('INSERT OR IGNORE INTO friendships(user_id,friend_id) VALUES(?,?)').run(req.user.id,request.sender_id);db.prepare('INSERT OR IGNORE INTO friendships(user_id,friend_id) VALUES(?,?)').run(request.sender_id,req.user.id);notify(request.sender_id,'friend_accepted',`${req.user.name} accepted your request.`);})();
  emitToUser(request.sender_id,'activity:changed',{kind:'friend_accepted'});
  return send(res,{accepted:true});
});
api.post('/friends/requests/:id/decline',(req,res)=>{
  const request=db.prepare("SELECT * FROM friend_requests WHERE id=? AND recipient_id=? AND status='pending'").get(req.params.id,req.user.id);
  if(!request)return res.status(404).json({error:{message:'Pending request not found.'}});
  db.prepare("UPDATE friend_requests SET status='declined' WHERE id=?").run(request.id);
  emitToUser(request.sender_id,'activity:changed',{kind:'friend_request_declined'});
  return send(res,{declined:true});
});
api.delete('/friends/:id',(req,res)=>{
  db.transaction(()=>{db.prepare('DELETE FROM friendships WHERE user_id=? AND friend_id=?').run(req.user.id,req.params.id);db.prepare('DELETE FROM friendships WHERE user_id=? AND friend_id=?').run(req.params.id,req.user.id);})();return send(res,{removed:true});
});
api.post('/friends/contacts/match',(req,res)=>{
  if(!req.user.phone_verified_at)return res.status(403).json({error:{message:'Verify your own phone number before matching contacts.'}});
  const values=req.body?.phoneNumbers;if(!Array.isArray(values)||values.length>100)return res.status(400).json({error:{message:'Submit up to 100 phone numbers at a time.'}});
  const phones=[...new Set(values.map(value=>String(value).trim()).filter(value=>/^\+[1-9]\d{6,14}$/.test(value)))];if(!phones.length)return send(res,[]);
  const placeholders=phones.map(()=>'?').join(',');
  const rows=db.prepare(`SELECT u.id,u.name,u.availability FROM users u WHERE u.role='student' AND u.phone_verified_at IS NOT NULL AND u.phone_e164 IN (${placeholders}) AND u.id<>? AND NOT EXISTS(SELECT 1 FROM friendships f WHERE f.user_id=? AND f.friend_id=u.id) AND NOT EXISTS(SELECT 1 FROM friend_requests r WHERE r.status='pending' AND ((r.sender_id=u.id AND r.recipient_id=?) OR (r.sender_id=? AND r.recipient_id=u.id))) ORDER BY u.name`).all(...phones,req.user.id,req.user.id,req.user.id,req.user.id);
  return send(res,rows.map(row=>({id:row.id,name:row.name,availability:row.availability})));
});
api.get('/settings',(req,res)=>{
  const s=db.prepare('SELECT * FROM settings WHERE user_id=?').get(req.user.id);
  return send(res,{shareByDefault:!!s.share_by_default,approximateAreas:!!s.approximate_areas,notificationsEnabled:!!s.notifications_enabled,invitations:s.invitations});
});
api.patch('/settings',(req,res)=>{
  const body=req.body??{},invites=body.invitations;
  if(invites!==undefined&&!['friends','none'].includes(invites))return res.status(400).json({error:{message:'Invitation preference is invalid.'}});
  const old=db.prepare('SELECT * FROM settings WHERE user_id=?').get(req.user.id);
  const next={shareByDefault:body.shareByDefault===undefined?!!old.share_by_default:!!body.shareByDefault,approximateAreas:body.approximateAreas===undefined?!!old.approximate_areas:!!body.approximateAreas,notificationsEnabled:body.notificationsEnabled===undefined?!!old.notifications_enabled:!!body.notificationsEnabled,invitations:invites??old.invitations};
  db.prepare('UPDATE settings SET share_by_default=?,approximate_areas=?,notifications_enabled=?,invitations=? WHERE user_id=?').run(+next.shareByDefault,+next.approximateAreas,+next.notificationsEnabled,next.invitations,req.user.id);return send(res,next);
});
api.get('/walks/active',(req,res)=>send(res,activeWalkFor(req.user.id)));
api.get('/walks',(req,res)=>{
  const rows=db.prepare(`SELECT DISTINCT w.id FROM walks w JOIN walk_participants p ON p.walk_id=w.id WHERE p.user_id=? ORDER BY w.created_at DESC LIMIT 50`).all(req.user.id);
  return send(res,rows.map(r=>getWalk(r.id)));
});
api.post('/walks',(req,res)=>{
  const {originId,destinationId,inviteUserIds=[],sharingEnabled=false}=req.body??{};
  if(!Array.isArray(inviteUserIds)||inviteUserIds.length>20)return res.status(400).json({error:{message:'Invitation list is invalid.'}});
  const walk=createWalk({ownerId:req.user.id,originId,destinationId,inviteUserIds,sharingEnabled:!!sharingEnabled});
  for(const userId of new Set(inviteUserIds))emitToUser(userId,'activity:changed',{kind:'invitation'});
  emitToWalk(walk.id,'walk:updated',walk);return send(res,walk,201);
});
api.get('/invitations',(req,res)=>send(res,db.prepare("SELECT * FROM invitations WHERE recipient_id=? AND status='pending' ORDER BY created_at DESC").all(req.user.id).map(formatInvitation)));
api.post('/invitations/:id/:answer',(req,res)=>{
  const {id,answer}=req.params;if(!['accept','decline'].includes(answer))return res.status(404).json({error:{message:'Unknown invitation action.'}});
  const invite=db.prepare("SELECT * FROM invitations WHERE id=? AND recipient_id=? AND status='pending'").get(id,req.user.id);if(!invite)return res.status(404).json({error:{message:'Pending invitation not found.'}});
  if(answer==='accept'){if(activeWalkFor(req.user.id))return res.status(409).json({error:{message:'End your current walk before joining another.'}});db.transaction(()=>{db.prepare("UPDATE invitations SET status='accepted' WHERE id=?").run(id);db.prepare("INSERT INTO walk_participants(walk_id,user_id,sharing_enabled) VALUES(?,?,0)").run(invite.walk_id,req.user.id);notify(invite.sender_id,'walk_joined',`${req.user.name} joined your walk.`);})();const updated=getWalk(invite.walk_id);emitToWalk(updated.id,'walk:updated',updated);emitToUser(invite.sender_id,'activity:changed',{kind:'participant'});return send(res,updated);}
  db.prepare("UPDATE invitations SET status='declined' WHERE id=?").run(id);notify(invite.sender_id,'invitation_declined',`${req.user.name} declined your walk invitation.`);emitToUser(invite.sender_id,'activity:changed',{kind:'invitation_declined'});return send(res,{declined:true});
});
api.post('/walks/:id/invitations',(req,res)=>{
  const walk=db.prepare("SELECT * FROM walks WHERE id=? AND status='active'").get(req.params.id);if(!walk||!hasMembership(req.user.id,walk.id))return res.status(404).json({error:{message:'Active walk not found.'}});
  const friendId=String(req.body?.userId??'');if(!db.prepare('SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?').get(req.user.id,friendId))return res.status(403).json({error:{message:'You can only invite a friend.'}});
  if(hasMembership(friendId,walk.id))return res.status(409).json({error:{message:'This friend already joined the walk.'}});
  if(db.prepare('SELECT invitations FROM settings WHERE user_id=?').get(friendId)?.invitations==='none')return res.status(403).json({error:{message:'This friend has turned off walk invitations.'}});
  const id=randomUUID();db.prepare("INSERT INTO invitations(id,walk_id,sender_id,recipient_id) VALUES(?,?,?,?) ON CONFLICT(walk_id,recipient_id) DO UPDATE SET id=excluded.id,sender_id=excluded.sender_id,status='pending',created_at=CURRENT_TIMESTAMP").run(id,walk.id,req.user.id,friendId);notify(friendId,'walk_invitation','A friend invited you to join a walk.');emitToUser(friendId,'activity:changed',{kind:'invitation'});return send(res,{id},201);
});
api.get('/walks/:id/invitations',(req,res)=>{
  if(!hasMembership(req.user.id,req.params.id))return res.status(404).json({error:{message:'Walk not found.'}});
  const rows=db.prepare("SELECT id,recipient_id FROM invitations WHERE walk_id=? AND status='pending'").all(req.params.id);
  return send(res,rows.map(row=>({id:row.id,recipientId:row.recipient_id})));
});
api.post('/walks/:id/end',(req,res)=>{
  const walk=db.prepare("SELECT * FROM walks WHERE id=? AND status='active'").get(req.params.id);if(!walk)return res.status(404).json({error:{message:'Active walk not found.'}});
  if(walk.owner_id!==req.user.id)return res.status(403).json({error:{message:'Only the walk organizer can end the walk.'}});
  const pendingRecipients=db.prepare("SELECT recipient_id FROM invitations WHERE walk_id=? AND status='pending'").all(walk.id).map(row=>row.recipient_id);
  db.transaction(()=>{db.prepare("UPDATE walks SET status='completed',ended_at=CURRENT_TIMESTAMP WHERE id=?").run(walk.id);db.prepare("UPDATE walk_participants SET sharing_enabled=0 WHERE walk_id=?").run(walk.id);db.prepare("UPDATE invitations SET status='declined' WHERE walk_id=? AND status='pending'").run(walk.id);for(const p of db.prepare('SELECT user_id FROM walk_participants WHERE walk_id=?').all(walk.id))notify(p.user_id,'walk_ended','This walk has ended. Position sharing is off.');})();locationService.stopForWalk(walk.id);
  for(const recipient of pendingRecipients)emitToUser(recipient,'activity:changed',{kind:'invitation_closed'});
  const updated=getWalk(walk.id);emitToWalk(walk.id,'walk:updated',updated);return send(res,updated);
});
api.post('/walks/:id/leave',(req,res)=>{
  const walk=db.prepare("SELECT * FROM walks WHERE id=? AND status='active'").get(req.params.id);
  if(!walk||!hasMembership(req.user.id,walk.id))return res.status(404).json({error:{message:'Active walk not found.'}});
  if(walk.owner_id===req.user.id)return res.status(409).json({error:{message:'The organizer must end the walk.'}});
  db.prepare("UPDATE walk_participants SET status='left',sharing_enabled=0 WHERE walk_id=? AND user_id=?").run(walk.id,req.user.id);
  locationService.stopForParticipant(walk.id,req.user.id);
  notify(walk.owner_id,'participant_left',`${req.user.name} left your walk. Their sharing preference was stopped.`);
  emitToWalk(walk.id,'walk:updated',getWalk(walk.id));
  return send(res,{left:true});
});
api.patch('/walks/:id/sharing',(req,res)=>{
  const walk=db.prepare("SELECT * FROM walks WHERE id=? AND status='active'").get(req.params.id);
  if(!walk||!hasMembership(req.user.id,walk.id))return res.status(404).json({error:{message:'Active walk not found.'}});
  const sharingEnabled=!!req.body?.sharingEnabled;
  db.prepare("UPDATE walk_participants SET sharing_enabled=? WHERE walk_id=? AND user_id=? AND status='joined'").run(+sharingEnabled,walk.id,req.user.id);
  if(!sharingEnabled)locationService.stopForParticipant(walk.id,req.user.id);
  notify(req.user.id,'sharing_changed',`Position sharing preference ${sharingEnabled?'enabled':'paused'} for this walk.`);
  const updated=getWalk(walk.id);emitToWalk(walk.id,'walk:updated',updated);return send(res,updated);
});
api.get('/walks/:id/messages',(req,res)=>{
  if(!hasMembership(req.user.id,req.params.id))return res.status(403).json({error:{message:'Only walk participants can view messages.'}});
  const rows=db.prepare('SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.walk_id=? ORDER BY m.created_at DESC LIMIT 200').all(req.params.id).reverse();
  return send(res,rows.map(m=>({id:m.id,walkId:m.walk_id,userId:m.user_id,name:m.name,body:m.body,createdAt:toIso(m.created_at)})));
});
api.post('/walks/:id/messages',(req,res)=>{
  const walk=db.prepare("SELECT id FROM walks WHERE id=? AND status='active'").get(req.params.id);if(!walk||!hasMembership(req.user.id,req.params.id))return res.status(403).json({error:{message:'Only active walk participants can send messages.'}});
  const body=String(req.body?.body??'').trim();if(!body||body.length>300)return res.status(400).json({error:{message:'Message must be 1 to 300 characters.'}});
  const id=randomUUID();db.prepare('INSERT INTO messages(id,walk_id,user_id,body) VALUES(?,?,?,?)').run(id,walk.id,req.user.id,body);
  const row=db.prepare('SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=?').get(id);const message={id,walkId:row.walk_id,userId:row.user_id,name:row.name,body:row.body,createdAt:toIso(row.created_at)};emitToWalk(walk.id,'walk:message',message);return send(res,message,201);
});
api.get('/notifications',(req,res)=>send(res,db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id).map(notification)));
api.post('/notifications/read',(req,res)=>{
  const id=req.body?.id;
  if(id)db.prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run(id,req.user.id);else db.prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL').run(req.user.id);
  return send(res,{updated:true});
});
api.post('/reports',(req,res)=>{
  const body=String(req.body?.body??'Walk problem reported').trim().slice(0,500);return send(res,safetyService.report(req.user.id,body),201);
});
api.post('/safety/sos',(req,res)=>send(res,safetyService.raiseSos(req.user.id),201));
api.post('/safety/check-in',(req,res)=>send(res,safetyService.checkIn(req.user.id),201));
api.get('/safety/events',(req,res)=>send(res,db.prepare('SELECT id,kind,body,created_at FROM safety_events WHERE user_id=? ORDER BY created_at DESC LIMIT 30').all(req.user.id).map(event=>({id:event.id,kind:event.kind,body:event.body,createdAt:toIso(event.created_at)}))));

// University-approved safety data is administered through the separate web portal.
api.get('/safety/emergency-contacts',(_req,res)=>send(res,db.prepare("SELECT id,name,role_label AS roleLabel,phone_e164 AS phoneE164,availability,is_development_fixture AS developmentFixture FROM emergency_contacts WHERE is_active=1 AND verified_at IS NOT NULL ORDER BY role_label,name").all().map(x=>({...x,developmentFixture:!!x.developmentFixture}))));
api.get('/safety/safe-spots',(req,res)=>{
  const lat=Number(req.query.latitude),lon=Number(req.query.longitude);
  if(!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lon)||lon < -180||lon>180)return res.status(400).json({error:{message:'Valid latitude and longitude are required.'}});
  const haversine=(a,b)=>{const r=6371,dLat=(b.latitude-a.latitude)*Math.PI/180,dLon=(b.longitude-a.longitude)*Math.PI/180,x=Math.sin(dLat/2)**2+Math.cos(a.latitude*Math.PI/180)*Math.cos(b.latitude*Math.PI/180)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(x));};
  const rows=db.prepare("SELECT id,name,category,description,latitude,longitude,address,contact_phone AS contactPhone,hours,is_development_fixture AS developmentFixture FROM safe_spots WHERE status='verified'").all().map(row=>({...row,distanceKm:Number(haversine({latitude:lat,longitude:lon},row).toFixed(2)),developmentFixture:!!row.developmentFixture})).sort((a,b)=>a.distanceKm-b.distanceKm);
  return send(res,rows);
});
api.post('/safety/reports',(req,res)=>{
  const b=req.body??{},type=String(b.reportType??''),category=String(b.category??'').trim(),description=String(b.description??'').trim().slice(0,700),visibility=b.visibility==='campus'?'campus':'friends',geometry=b.geometry;
  if(!['place','route','area'].includes(type)||!category||!geometry||!Array.isArray(geometry.coordinates))return res.status(400).json({error:{message:'Choose a report type, category and map location.'}});
  const coords=geometry.coordinates,validPair=p=>Array.isArray(p)&&p.length===2&&Number.isFinite(Number(p[0]))&&Number(p[0])>=-180&&Number(p[0])<=180&&Number.isFinite(Number(p[1]))&&Number(p[1])>=-90&&Number(p[1])<=90;
  const valid=type==='place'?geometry.type==='Point'&&validPair(coords):type==='route'?geometry.type==='LineString'&&coords.length>=2&&coords.length<=100&&coords.every(validPair):geometry.type==='Polygon'&&coords.length===1&&Array.isArray(coords[0])&&coords[0].length>=4&&coords[0].length<=101&&coords[0].every(validPair)&&JSON.stringify(coords[0][0])===JSON.stringify(coords[0][coords[0].length-1]);
  if(!valid)return res.status(400).json({error:{message:'Report geometry is invalid for the selected place, route or area type.'}});
  const id=randomUUID();db.prepare('INSERT INTO unsafe_reports(id,reporter_id,report_type,category,description,geometry_json,visibility) VALUES(?,?,?,?,?,?,?)').run(id,req.user.id,type,category,description||null,JSON.stringify({type:geometry.type??(type==='place'?'Point':'LineString'),coordinates:coords}),visibility);
  db.prepare('INSERT INTO unsafe_report_events(id,report_id,actor_id,action) VALUES(?,?,?,?)').run(randomUUID(),id,req.user.id,'submitted');
  return send(res,{id,status:'pending',message:'Your report is saved for review.'},201);
});
api.get('/safety/reports/mine',(req,res)=>send(res,db.prepare('SELECT id,report_type AS reportType,category,description,geometry_json AS geometry,visibility,status,created_at AS createdAt FROM unsafe_reports WHERE reporter_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id).map(x=>({...x,geometry:JSON.parse(x.geometry)}))));
api.get('/safety/reports/shared',(req,res)=>send(res,db.prepare(`SELECT DISTINCT r.id,r.report_type AS reportType,r.category,r.description,r.geometry_json AS geometry,r.created_at AS createdAt FROM unsafe_reports r
  WHERE r.status='approved' AND (r.expires_at IS NULL OR r.expires_at>CURRENT_TIMESTAMP)
  AND (r.visibility='campus' OR EXISTS(SELECT 1 FROM friendships f WHERE f.user_id=? AND f.friend_id=r.reporter_id))
  ORDER BY r.created_at DESC LIMIT 200`).all(req.user.id).map(x=>({...x,geometry:JSON.parse(x.geometry)}))));

api.patch('/profile/saved-start',(req,res)=>{
  const label=String(req.body?.label??'').trim().slice(0,100),lat=Number(req.body?.latitude),lon=Number(req.body?.longitude);
  if(label&&(!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lon)||lon < -180||lon>180))return res.status(400).json({error:{message:'Saved start needs valid map coordinates.'}});
  db.prepare('UPDATE users SET saved_start_label=?,saved_start_latitude=?,saved_start_longitude=? WHERE id=?').run(label||null,label?lat:null,label?lon:null,req.user.id);
  return send(res,{savedStart:label?{label,latitude:lat,longitude:lon}:null});
});
api.post('/profile/phone/request',asyncRoute(async(req,res)=>{
  const phone=String(req.body?.phoneE164??'').trim();if(!/^\+[1-9]\d{6,14}$/.test(phone))return res.status(400).json({error:{message:'Enter a valid international phone number, such as +256…'}});
  db.prepare('DELETE FROM phone_verification_challenges WHERE expires_at<=?').run(new Date().toISOString());
  if(db.prepare('SELECT 1 FROM users WHERE phone_e164=? AND phone_verified_at IS NOT NULL AND id<>?').get(phone,req.user.id))return res.status(409).json({error:{message:'That phone number is verified on another account.'}});
  if(db.prepare("SELECT COUNT(*) AS count FROM phone_verification_challenges WHERE user_id=? AND created_at>datetime('now','-1 hour')").get(req.user.id).count>=3)return res.status(429).json({error:{message:'Too many verification requests. Try again later.'}});
  const code=String(randomInt(100000,1000000)),id=randomUUID(),hash=await bcrypt.hash(code,10),expiresAt=new Date(Date.now()+10*60_000).toISOString();
  db.prepare('INSERT INTO phone_verification_challenges(id,user_id,phone_e164,code_hash,expires_at) VALUES(?,?,?,?,?)').run(id,req.user.id,phone,hash,expiresAt);
  try{const delivery=await smsService.sendVerificationCode({phoneE164:phone,code});return send(res,{challengeId:id,expiresAt,...(delivery.developmentCode?{developmentCode:delivery.developmentCode}:{})},201);}catch(error){db.prepare('DELETE FROM phone_verification_challenges WHERE id=?').run(id);throw error;}
}));
api.post('/profile/phone/verify',asyncRoute(async(req,res)=>{
  const id=String(req.body?.challengeId??''),code=String(req.body?.code??''),challenge=db.prepare('SELECT * FROM phone_verification_challenges WHERE id=? AND user_id=?').get(id,req.user.id);
  if(!challenge||Date.parse(challenge.expires_at)<=Date.now()||challenge.attempts>=5)return res.status(410).json({error:{message:'Verification code expired. Request a new code.'}});
  if(!/^\d{6}$/.test(code)||!await bcrypt.compare(code,challenge.code_hash)){db.prepare('UPDATE phone_verification_challenges SET attempts=attempts+1 WHERE id=?').run(id);return res.status(400).json({error:{message:'Verification code is incorrect.'}});}
  try{db.transaction(()=>{db.prepare('UPDATE users SET phone_e164=?,phone_verified_at=CURRENT_TIMESTAMP WHERE id=?').run(challenge.phone_e164,req.user.id);db.prepare('DELETE FROM phone_verification_challenges WHERE user_id=?').run(req.user.id);})();}catch(error){if(String(error).includes('UNIQUE'))return res.status(409).json({error:{message:'That phone number is verified on another account.'}});throw error;}
  return send(res,{verified:true,phoneE164:challenge.phone_e164});
}));

api.post('/walks/:id/location',(req,res)=>{
  try{return send(res,locationService.publish(req.params.id,req.user.id,{latitude:Number(req.body?.latitude),longitude:Number(req.body?.longitude)}));}
  catch(error){return res.status(error.status||500).json({error:{message:error.message}});}
});
api.get('/walks/:id/locations',(req,res)=>{
  if(!hasMembership(req.user.id,req.params.id))return res.status(403).json({error:{message:'Only joined walk participants can view locations.'}});
  return send(res,locationService.currentForWalk(req.params.id));
});
api.post('/walks/:id/arrived',(req,res)=>{
  try{return send(res,locationService.markArrived(req.params.id,req.user.id));}
  catch(error){return res.status(error.status||500).json({error:{message:error.message}});}
});

api.get('/rides',(req,res)=>send(res,db.prepare(`SELECT r.*,t.business_name,t.phone_e164 AS transporter_phone,t.vehicle_description FROM ride_bookings r JOIN transporters t ON t.user_id=r.transporter_id WHERE r.student_id=? ORDER BY r.created_at DESC LIMIT 100`).all(req.user.id)));
api.get('/rides/transporters',(_req,res)=>send(res,db.prepare("SELECT t.user_id AS id,t.business_name AS businessName,t.phone_e164 AS phoneE164,t.vehicle_description AS vehicleDescription,t.service_area AS serviceArea FROM transporters t WHERE t.status='verified' AND t.is_available=1 ORDER BY t.business_name").all()));
api.post('/rides',(req,res)=>{
  const b=req.body??{},point=(lat,lon)=>Number.isFinite(Number(lat))&&Number(lat)>=-90&&Number(lat)<=90&&Number.isFinite(Number(lon))&&Number(lon)>=-180&&Number(lon)<=180;
  const transporter=db.prepare("SELECT 1 FROM transporters WHERE user_id=? AND status='verified' AND is_available=1").get(b.transporterId);
  if(!transporter||!String(b.pickupLabel??'').trim()||!String(b.destinationLabel??'').trim()||!point(b.pickupLatitude,b.pickupLongitude)||!point(b.destinationLatitude,b.destinationLongitude))return res.status(400).json({error:{message:'Choose an available verified transporter and valid pickup and destination points.'}});
  const pickupAt=new Date(b.pickupAt??Date.now());if(!Number.isFinite(pickupAt.getTime())||pickupAt.getTime()<Date.now()-60_000)return res.status(400).json({error:{message:'Choose a pickup time in the future.'}});
  const count=Math.min(8,Math.max(1,Number(b.passengerCount)||1)),id=randomUUID();
  db.transaction(()=>{db.prepare('INSERT INTO ride_bookings(id,student_id,transporter_id,pickup_label,pickup_latitude,pickup_longitude,destination_label,destination_latitude,destination_longitude,pickup_at,passenger_count,note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,req.user.id,b.transporterId,String(b.pickupLabel).trim(),Number(b.pickupLatitude),Number(b.pickupLongitude),String(b.destinationLabel).trim(),Number(b.destinationLatitude),Number(b.destinationLongitude),pickupAt.toISOString(),count,String(b.note??'').trim().slice(0,300)||null);db.prepare('INSERT INTO ride_booking_events(id,booking_id,actor_id,action) VALUES(?,?,?,?)').run(randomUUID(),id,req.user.id,'requested');});
  notify(b.transporterId,'ride_requested','A student sent you a ride request.');emitToUser(b.transporterId,'activity:changed',{kind:'ride'});
  return send(res,{id,status:'requested'},201);
});
api.patch('/rides/:id/cancel',(req,res)=>{
  const row=db.prepare("SELECT * FROM ride_bookings WHERE id=? AND student_id=? AND status='requested'").get(req.params.id,req.user.id);if(!row)return res.status(404).json({error:{message:'A pending ride request was not found.'}});
  db.transaction(()=>{db.prepare("UPDATE ride_bookings SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);db.prepare('INSERT INTO ride_booking_events(id,booking_id,actor_id,action) VALUES(?,?,?,?)').run(randomUUID(),row.id,req.user.id,'cancelled');notify(row.transporter_id,'ride_cancelled','A student cancelled a ride request.');})();emitToUser(row.transporter_id,'activity:changed',{kind:'ride'});return send(res,{cancelled:true});
});
