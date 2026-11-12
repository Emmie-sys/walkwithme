import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/database.js';
import { getWalk, hasMembership } from './walks.js';

let socketServer;
export function attachRealtime(io) {
  socketServer=io;
  io.use((socket,next)=>{
    const token=socket.handshake.auth?.token;
    if(!token)return next(new Error('authentication required'));
    try {
      const payload=jwt.verify(token,config.jwtSecret);
      if(!db.prepare('SELECT 1 FROM users WHERE id=?').get(payload.sub))return next(new Error('account not found'));
      socket.data.userId=payload.sub;socket.data.tokenExpiresAt=payload.exp*1000;next();
    } catch { next(new Error('invalid credentials')); }
  });
  io.on('connection',socket=>{
    socket.join(`user:${socket.data.userId}`);
    const expiresIn=Math.max(0,socket.data.tokenExpiresAt-Date.now());
    const expiryTimer=setTimeout(()=>socket.disconnect(true),expiresIn);
    socket.on('disconnect',()=>clearTimeout(expiryTimer));
    socket.on('walk:join',walkId=>{
      if(typeof walkId!=='string'||!hasMembership(socket.data.userId,walkId))return socket.emit('walk:error',{message:'Walk membership is required.'});
      const snapshot=getWalk(walkId);
      if(!snapshot||snapshot.status!=='active')return socket.emit('walk:error',{message:'This walk is no longer active.'});
      socket.join(`walk:${walkId}`);socket.emit('walk:updated',snapshot);
    });
    socket.on('walk:leave',walkId=>{if(typeof walkId==='string')socket.leave(`walk:${walkId}`);});
  });
}
export const emitToWalk=(walkId,event,payload)=>socketServer?.to(`walk:${walkId}`).emit(event,payload);
export const emitToUser=(userId,event,payload)=>socketServer?.to(`user:${userId}`).emit(event,payload);
