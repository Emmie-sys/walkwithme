import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { emitToUser } from '../services/realtime.js';
import { notify } from '../services/walks.js';

export const adminApi = Router();
const send=(res,data,status=200)=>res.status(status).json({data});
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const adminPublic=row=>({id:row.id,name:row.name,email:row.email,role:row.role});
const audit=(adminId,action,entityType,entityId,details)=>db.prepare('INSERT INTO admin_audit_log(id,admin_id,action,entity_type,entity_id,details_json) VALUES(?,?,?,?,?,?)').run(randomUUID(),adminId,action,entityType,String(entityId),details?JSON.stringify(details):null);
const validPoint=(body)=>Number.isFinite(Number(body.latitude))&&Number(body.latitude)>=-90&&Number(body.latitude)<=90&&Number.isFinite(Number(body.longitude))&&Number(body.longitude)>=-180&&Number(body.longitude)<=180;
const phoneValid=value=>/^\+[1-9]\d{6,14}$/.test(String(value??''));

/** The admin portal has its own login route; regular student/transporter login never authenticates admin sessions. */
adminApi.post('/auth/login',asyncRoute(async(req,res)=>{
  const email=String(req.body?.email??'').trim().toLowerCase(),password=String(req.body?.password??'');
  const row=db.prepare("SELECT * FROM users WHERE email=? COLLATE NOCASE AND role='admin'").get(email);
  if(!row||!await bcrypt.compare(password,row.password_hash))return res.status(401).json({error:{message:'Email or password is not correct.'}});
  const token=jwt.sign({sub:row.id},config.jwtSecret,{expiresIn:'8h'});
  return send(res,{token,user:adminPublic(row)});
}));
adminApi.use(requireAuth,requireRole('admin'));

adminApi.get('/me',(req,res)=>send(res,adminPublic(req.user)));
adminApi.get('/overview',(_req,res)=>send(res,{
  pendingReports:db.prepare("SELECT COUNT(*) AS count FROM unsafe_reports WHERE status='pending'").get().count,
  pendingTransporters:db.prepare("SELECT COUNT(*) AS count FROM transporters WHERE status='pending'").get().count,
  pendingRides:db.prepare("SELECT COUNT(*) AS count FROM ride_bookings WHERE status='requested'").get().count,
  verifiedSafeSpots:db.prepare("SELECT COUNT(*) AS count FROM safe_spots WHERE status='verified'").get().count,
  activeEmergencyContacts:db.prepare('SELECT COUNT(*) AS count FROM emergency_contacts WHERE is_active=1').get().count,
}));

// Emergency contact CRUD is audited so phone updates have a clear owner and history.
adminApi.get('/emergency-contacts',(_req,res)=>send(res,db.prepare('SELECT * FROM emergency_contacts ORDER BY is_active DESC,role_label,name').all()));
adminApi.post('/emergency-contacts',(req,res)=>{
  const body=req.body??{};if(!String(body.name??'').trim()||!String(body.roleLabel??'').trim()||!phoneValid(body.phoneE164))return res.status(400).json({error:{message:'Name, role and an E.164 phone number are required.'}});
  const id=randomUUID();db.prepare('INSERT INTO emergency_contacts(id,name,role_label,phone_e164,availability,notes,is_active,verified_at) VALUES(?,?,?,?,?,?,?,?)').run(id,String(body.name).trim(),String(body.roleLabel).trim(),body.phoneE164,body.availability??null,body.notes??null,body.isActive===false?0:1,body.verified===true?new Date().toISOString():null);
  audit(req.user.id,'created','emergency_contact',id,{roleLabel:body.roleLabel});return send(res,{id},201);
});
adminApi.patch('/emergency-contacts/:id',(req,res)=>{
  const old=db.prepare('SELECT * FROM emergency_contacts WHERE id=?').get(req.params.id);if(!old)return res.status(404).json({error:{message:'Emergency contact not found.'}});
  const body=req.body??{},name=String(body.name??old.name).trim(),role=String(body.roleLabel??old.role_label).trim(),phone=String(body.phoneE164??old.phone_e164);
  if(!name||!role||!phoneValid(phone))return res.status(400).json({error:{message:'Name, role and an E.164 phone number are required.'}});
  const active=body.isActive===undefined?old.is_active:body.isActive?1:0;
  const verified=body.verified===undefined?old.verified_at:body.verified?new Date().toISOString():null;
  db.prepare("UPDATE emergency_contacts SET name=?,role_label=?,phone_e164=?,availability=?,notes=?,is_active=?,verified_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(name,role,phone,body.availability===undefined?old.availability:body.availability,body.notes===undefined?old.notes:body.notes,active,verified,old.id);
  audit(req.user.id,'updated','emergency_contact',old.id,{isActive:!!active,verified:!!verified});return send(res,{updated:true});
});
adminApi.delete('/emergency-contacts/:id',(req,res)=>{const result=db.prepare('UPDATE emergency_contacts SET is_active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.params.id);if(!result.changes)return res.status(404).json({error:{message:'Emergency contact not found.'}});audit(req.user.id,'deactivated','emergency_contact',req.params.id);return send(res,{updated:true});});

// Safe spots are staged as pending so new records cannot be advertised before verification.
adminApi.get('/safe-spots',(_req,res)=>send(res,db.prepare('SELECT * FROM safe_spots ORDER BY status,name').all()));
adminApi.post('/safe-spots',(req,res)=>{
  const b=req.body??{};if(!String(b.name??'').trim()||!String(b.category??'').trim()||!validPoint(b))return res.status(400).json({error:{message:'Name, category and valid map coordinates are required.'}});
  const id=randomUUID();db.prepare('INSERT INTO safe_spots(id,name,category,description,latitude,longitude,address,contact_phone,hours) VALUES(?,?,?,?,?,?,?,?,?)').run(id,String(b.name).trim(),String(b.category).trim(),b.description??null,Number(b.latitude),Number(b.longitude),b.address??null,b.contactPhone??null,b.hours??null);
  audit(req.user.id,'created','safe_spot',id);return send(res,{id,status:'pending'},201);
});
adminApi.patch('/safe-spots/:id',(req,res)=>{
  const old=db.prepare('SELECT * FROM safe_spots WHERE id=?').get(req.params.id);if(!old)return res.status(404).json({error:{message:'Safe spot not found.'}});
  const b=req.body??{},lat=b.latitude===undefined?old.latitude:Number(b.latitude),lon=b.longitude===undefined?old.longitude:Number(b.longitude);
  if(!validPoint({latitude:lat,longitude:lon}))return res.status(400).json({error:{message:'Valid map coordinates are required.'}});
  const allowed=new Set(['pending','verified','closed','rejected']),status=b.status??old.status;if(!allowed.has(status))return res.status(400).json({error:{message:'Safe spot status is invalid.'}});
  db.prepare('UPDATE safe_spots SET name=?,category=?,description=?,latitude=?,longitude=?,address=?,contact_phone=?,hours=?,status=?,is_development_fixture=0,verified_by=?,verified_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(b.name??old.name,b.category??old.category,b.description===undefined?old.description:b.description,lat,lon,b.address===undefined?old.address:b.address,b.contactPhone===undefined?old.contact_phone:b.contactPhone,b.hours===undefined?old.hours:b.hours,status,status==='verified'?req.user.id:null,status==='verified'?new Date().toISOString():null,old.id);
  audit(req.user.id,'set_status','safe_spot',old.id,{status});return send(res,{updated:true,status});
});
adminApi.delete('/safe-spots/:id',(req,res)=>{const result=db.prepare('DELETE FROM safe_spots WHERE id=?').run(req.params.id);if(!result.changes)return res.status(404).json({error:{message:'Safe spot not found.'}});audit(req.user.id,'deleted','safe_spot',req.params.id);return send(res,{deleted:true});});

adminApi.get('/unsafe-reports',(req,res)=>{
  const status=String(req.query.status??'pending');if(!['pending','approved','rejected','expired','all'].includes(status))return res.status(400).json({error:{message:'Report filter is invalid.'}});
  const rows=status==='all'?db.prepare('SELECT r.*,u.name AS reporter_name,u.email AS reporter_email FROM unsafe_reports r JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC LIMIT 500').all():db.prepare('SELECT r.*,u.name AS reporter_name,u.email AS reporter_email FROM unsafe_reports r JOIN users u ON u.id=r.reporter_id WHERE r.status=? ORDER BY r.created_at DESC LIMIT 500').all(status);
  return send(res,rows.map(row=>({...row,geometry:JSON.parse(row.geometry_json)})));
});
adminApi.patch('/unsafe-reports/:id',(req,res)=>{
  const old=db.prepare('SELECT * FROM unsafe_reports WHERE id=?').get(req.params.id);if(!old)return res.status(404).json({error:{message:'Report not found.'}});
  const status=String(req.body?.status??'');if(!['approved','rejected','expired'].includes(status))return res.status(400).json({error:{message:'Choose approved, rejected or expired.'}});
  const note=String(req.body?.reviewNote??'').trim().slice(0,500);
  db.transaction(()=>{
    db.prepare('UPDATE unsafe_reports SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,req.user.id,note||null,old.id);
    db.prepare('INSERT INTO unsafe_report_events(id,report_id,actor_id,action,note) VALUES(?,?,?,?,?)').run(randomUUID(),old.id,req.user.id,status,note||null);
    audit(req.user.id,status,'unsafe_report',old.id,{visibility:old.visibility});
    if(status==='approved') {
      const recipients=old.visibility==='campus'?db.prepare("SELECT id FROM users WHERE role='student' AND id<>?").all(old.reporter_id):db.prepare('SELECT friend_id AS id FROM friendships WHERE user_id=?').all(old.reporter_id);
      for(const {id} of recipients){notify(id,'unsafe_area_approved','A safety report has been reviewed and published.');emitToUser(id,'activity:changed',{kind:'unsafe_area'});}
    }
  })();
  return send(res,{updated:true,status});
});

// Admin-provisioned transporter accounts can be used only in the transporter mobile area.
adminApi.get('/transporters',(_req,res)=>send(res,db.prepare(`SELECT t.*,u.name,u.email FROM transporters t JOIN users u ON u.id=t.user_id ORDER BY t.status,t.business_name`).all()));
adminApi.post('/transporters',asyncRoute(async(req,res)=>{
  const b=req.body??{},name=String(b.name??'').trim(),email=String(b.email??'').trim().toLowerCase(),business=String(b.businessName??'').trim(),phone=String(b.phoneE164??''),vehicle=String(b.vehicleDescription??'').trim(),area=String(b.serviceArea??'').trim(),password=String(b.initialPassword??'');
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||!business||!phoneValid(phone)||!vehicle||!area||password.length<12)return res.status(400).json({error:{message:'Enter the required profile data and an initial password of at least 12 characters.'}});
  if(db.prepare('SELECT 1 FROM users WHERE email=? COLLATE NOCASE').get(email))return res.status(409).json({error:{message:'An account already exists for that email.'}});
  const id=randomUUID(),passwordHash=await bcrypt.hash(password,10);
  db.transaction(()=>{db.prepare("INSERT INTO users(id,name,email,student_id,password_hash,role,phone_e164,phone_verified_at) VALUES(?,?,?,?,?,'transporter',?,CURRENT_TIMESTAMP)").run(id,name,email,`TRANS-${id.slice(0,8)}`,passwordHash,phone);db.prepare('INSERT INTO settings(user_id) VALUES(?)').run(id);db.prepare('INSERT INTO transporters(user_id,business_name,phone_e164,vehicle_description,service_area,status,verified_by,verified_at) VALUES(?,?,?,?,? ,?, ?, ?)').run(id,business,phone,vehicle,area,b.approveNow?'verified':'pending',b.approveNow?req.user.id:null,b.approveNow?new Date().toISOString():null);audit(req.user.id,'created','transporter',id,{businessName:business,approved:!!b.approveNow});})();
  return send(res,{id,status:b.approveNow?'verified':'pending'},201);
}));
adminApi.patch('/transporters/:id',(req,res)=>{
  const old=db.prepare('SELECT * FROM transporters WHERE user_id=?').get(req.params.id);if(!old)return res.status(404).json({error:{message:'Transporter not found.'}});
  const status=String(req.body?.status??old.status);if(!['pending','verified','suspended','rejected'].includes(status))return res.status(400).json({error:{message:'Transporter status is invalid.'}});
  const verifiedBy=status==='verified'?req.user.id:null,verifiedAt=status==='verified'?new Date().toISOString():null;
  db.prepare("UPDATE transporters SET status=?,verified_by=?,verified_at=?,is_available=CASE WHEN ?='verified' THEN is_available ELSE 0 END,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").run(status,verifiedBy,verifiedAt,status,old.user_id);
  db.prepare("UPDATE users SET role='transporter' WHERE id=?").run(old.user_id);
  audit(req.user.id,'set_status','transporter',old.user_id,{status});return send(res,{updated:true,status});
});

adminApi.get('/audit-log',(_req,res)=>send(res,db.prepare(`SELECT a.id,a.action,a.entity_type AS entityType,a.entity_id AS entityId,a.details_json AS details,a.created_at AS createdAt,u.name AS adminName FROM admin_audit_log a JOIN users u ON u.id=a.admin_id ORDER BY a.created_at DESC LIMIT 250`).all()));
