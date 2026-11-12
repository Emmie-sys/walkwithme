import { randomUUID } from 'node:crypto';
import { db } from '../../db/database.js';

/** Local-only emergency adapter. It records the student's action and never contacts anyone. */
export const localEmergencyProvider={
  recordSos(userId){
    const id=randomUUID();db.prepare('INSERT INTO safety_events(id,user_id,kind,body) VALUES(?,?,?,?)').run(id,userId,'sos_recorded','SOS action recorded locally. No contact was notified.');
    return {id,recorded:true,externalContactNotified:false};
  },
  recordCheckIn(userId){
    const id=randomUUID();db.prepare('INSERT INTO safety_events(id,user_id,kind,body) VALUES(?,?,?,?)').run(id,userId,'check_in','Student recorded a safety check-in.');
    return {id,recorded:true};
  },
};
