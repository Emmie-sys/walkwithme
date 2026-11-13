import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { config } from './config.js';
import { db } from './db/database.js';
import './db/seed.js';
import { api } from './routes/api.js';
import { adminApi } from './routes/admin.js';
import { transporterApi } from './routes/transporter.js';
import { locationService } from './services/location.js';
import { smsService } from './services/sms.js';
import { attachRealtime } from './services/realtime.js';

if(process.env.NODE_ENV==='production'&&(config.jwtSecret==='local-only-change-this-secret-before-deployment'||config.jwtSecret.length<32))throw new Error('Set a JWT_SECRET with at least 32 characters before running in production.');
const app=express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({origin:true,credentials:false}));
app.use(express.json({limit:'32kb'}));
app.get('/',(_req,res)=>res.json({service:'Walk with Me local API',health:'/api/health'}));
app.use('/api/admin',adminApi);
app.use('/api/transporter',transporterApi);
app.use('/api',api);
app.use((req,res)=>res.status(404).json({error:{message:`Route not found: ${req.method} ${req.path}`}}));
app.use((error,_req,res,_next)=>{
  console.error(error);
  const status=Number(error.status)||500;
  res.status(status).json({error:{message:status<500?error.message:'The server could not complete that request.'}});
});
const server=createServer(app);
const io=new SocketServer(server,{cors:{origin:true,methods:['GET','POST']}});
attachRealtime(io);
const locationCleanup=setInterval(()=>{
  try{locationService.cleanupExpired();}catch(error){console.error('Location cleanup failed',error);}
  try{smsService.cleanupExpired();}catch(error){console.error('Phone verification cleanup failed',error);}
},30_000);
server.listen(config.port,config.host,()=>console.log(`Walk with Me API listening on http://${config.host}:${config.port}`));
function shutdown(){clearInterval(locationCleanup);server.close(()=>{db.close();process.exit(0);});}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
