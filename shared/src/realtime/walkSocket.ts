import { io } from 'socket.io-client';
import { apiBaseUrl, getAuthToken } from '../api/http';
import type { Message, Walk } from '../types';

function createSocket() { return io(apiBaseUrl.replace(/\/api\/?$/,''),{auth:callback=>callback({token:getAuthToken()}),reconnection:true,timeout:10000}); }
export function subscribeToActivity(onChanged:()=>void) {
  const socket=createSocket();socket.on('activity:changed',onChanged);return()=>socket.disconnect();
}

/** Realtime transport is isolated so polling or another event provider can replace it cleanly. */
export function subscribeToWalk(walkId:string, handlers:{onMessage:(message:Message)=>void;onWalkChanged:(walk:Walk)=>void;onError?:(message:string)=>void}) {
  const socket=createSocket();
  socket.on('connect',()=>socket.emit('walk:join',walkId));
  socket.on('walk:message',(message:Message)=>{if(message.walkId===walkId)handlers.onMessage(message);});
  socket.on('walk:updated',(walk:Walk)=>{if(walk.id===walkId)handlers.onWalkChanged(walk);});
  socket.on('walk:error',(error:{message:string})=>handlers.onError?.(error.message));
  return ()=>{socket.emit('walk:leave',walkId);socket.disconnect();};
}
