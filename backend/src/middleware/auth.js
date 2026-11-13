import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/database.js';

/** Verify a short-lived access token and attach only the current user's public fields. */
export function requireAuth(req,res,next) {
  const header=req.get('authorization')??'';
  if(!header.startsWith('Bearer '))return res.status(401).json({error:{message:'Sign in is required.'}});
  try {
    const payload=jwt.verify(header.slice(7),config.jwtSecret);
    const row=db.prepare('SELECT id,name,email,student_id,availability,role,phone_e164,phone_verified_at,saved_start_label,saved_start_latitude,saved_start_longitude FROM users WHERE id=?').get(payload.sub);
    if(!row)return res.status(401).json({error:{message:'Account no longer exists.'}});
    req.user=row;next();
  } catch { return res.status(401).json({error:{message:'Session expired. Please sign in again.'}}); }
}

/** Restrict a protected route by account role. UI visibility is never an authorization boundary. */
export const requireRole=(...roles)=>(req,res,next)=>{
  if(!req.user||!roles.includes(req.user.role))return res.status(403).json({error:{message:'This account is not allowed to use this area.'}});
  next();
};
