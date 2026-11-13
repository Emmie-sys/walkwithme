import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { emitToUser } from '../services/realtime.js';
import { notify } from '../services/walks.js';

export const transporterApi = Router();
transporterApi.use(requireAuth, requireRole('transporter'));
const send=(res,data,status=200)=>res.status(status).json({data});
const profile=db.prepare('SELECT * FROM transporters WHERE user_id=?');
const booking=db.prepare('SELECT * FROM ride_bookings WHERE id=?');

transporterApi.get('/me',(req,res)=>{
  const row=profile.get(req.user.id);
  if(!row||row.status!=='verified')return res.status(403).json({error:{message:'Transporter approval is required.'}});
  return send(res,{businessName:row.business_name,phoneE164:row.phone_e164,vehicleDescription:row.vehicle_description,serviceArea:row.service_area,status:row.status,isAvailable:!!row.is_available});
});
transporterApi.get('/bookings',(req,res)=>{
  const row=profile.get(req.user.id);if(!row||row.status!=='verified')return res.status(403).json({error:{message:'Transporter approval is required.'}});
  const rows=db.prepare(`SELECT r.*,u.name AS student_name FROM ride_bookings r JOIN users u ON u.id=r.student_id WHERE r.transporter_id=? ORDER BY CASE r.status WHEN 'requested' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END,r.pickup_at`).all(req.user.id);
  return send(res,rows);
});
transporterApi.patch('/availability',(req,res)=>{
  const row=profile.get(req.user.id);if(!row||row.status!=='verified')return res.status(403).json({error:{message:'Transporter approval is required.'}});
  const isAvailable=req.body?.isAvailable?1:0;
  db.prepare('UPDATE transporters SET is_available=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?').run(isAvailable,req.user.id);
  return send(res,{isAvailable:!!isAvailable});
});
transporterApi.patch('/bookings/:id',(req,res)=>{
  const row=booking.get(req.params.id);if(!row||row.transporter_id!==req.user.id)return res.status(404).json({error:{message:'Ride request not found.'}});
  const action=String(req.body?.action??'');
  const next={accept:['requested','accepted'],decline:['requested','declined'],complete:['accepted','completed']}[action];
  if(!next||row.status!==next[0])return res.status(409).json({error:{message:'This ride request cannot take that action.'}});
  db.transaction(()=>{
    db.prepare('UPDATE ride_bookings SET status=?,accepted_at=CASE WHEN ?=? THEN CURRENT_TIMESTAMP ELSE accepted_at END,completed_at=CASE WHEN ?=? THEN CURRENT_TIMESTAMP ELSE completed_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(next[1],next[1],'accepted',next[1],'completed',row.id);
    db.prepare('INSERT INTO ride_booking_events(id,booking_id,actor_id,action) VALUES(?,?,?,?)').run(randomUUID(),row.id,req.user.id,action);
    notify(row.student_id,`ride_${next[1]}`,`Your ride request was ${next[1]}.`);
  })();
  emitToUser(row.student_id,'activity:changed',{kind:'ride'});
  return send(res,{status:next[1]});
});
