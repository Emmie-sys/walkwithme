import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './database.js';
import './migrate.js';

/** Fictional seed users make local development immediately explorable. Never used these in production. */
const users=[
  ['demo-amina','Amina Akello','amina@demo.gu.ac.ug','DEMO-0001','Walk1234'],
  ['demo-brian','Brian Okello','brian@demo.gu.ac.ug','DEMO-0002','Walk1234'],
  ['demo-grace','Grace Atim','grace@demo.gu.ac.ug','DEMO-0003','Walk1234'],
  ['demo-peter','Peter Ocen','peter@demo.gu.ac.ug','DEMO-0004','Walk1234'],
  ['demo-sarah','Sarah Lamunu','sarah@demo.gu.ac.ug','DEMO-0005','Walk1234'],
  ['demo-joan','Joan Adong','joan@demo.gu.ac.ug','DEMO-0006','Walk1234'],
];
const seed=db.transaction(()=>{
  const insertUser=db.prepare('INSERT OR IGNORE INTO users(id,name,email,student_id,password_hash) VALUES(?,?,?,?,?)');
  const insertSettings=db.prepare('INSERT OR IGNORE INTO settings(user_id) VALUES(?)');
  const insertFriend=db.prepare('INSERT OR IGNORE INTO friendships(user_id,friend_id) VALUES(?,?)');
  const insertRequest=db.prepare("INSERT OR IGNORE INTO friend_requests(id,sender_id,recipient_id,status) VALUES(?,?,?,'pending')");
  for(const [id,name,email,sid,password] of users){insertUser.run(id,name,email,sid,bcrypt.hashSync(password,10));insertSettings.run(id);}
  [['demo-amina','demo-brian'],['demo-amina','demo-grace'],['demo-amina','demo-peter'],['demo-amina','demo-sarah']].forEach(([a,b])=>{insertFriend.run(a,b);insertFriend.run(b,a);});
  insertRequest.run('request-joan','demo-joan','demo-amina');
  const exists=db.prepare('SELECT 1 FROM notifications WHERE id=?').get('welcome-reminder');
  if(!exists)db.prepare("INSERT INTO notifications(id,user_id,kind,body) VALUES('welcome-reminder','demo-amina','safety_reminder','Tell a trusted friend before you begin a late walk.')").run();
  if(!db.prepare('SELECT 1 FROM walks WHERE id=?').get('seed-active-walk')) {
    db.prepare("INSERT INTO walks(id,owner_id,origin_id,destination_id,status,created_at) VALUES('seed-active-walk','demo-brian','library','hostel','active',datetime('now','-5 minutes'))").run();
    db.prepare("INSERT INTO walk_participants(walk_id,user_id,sharing_enabled) VALUES('seed-active-walk','demo-brian',0)").run();
    db.prepare("INSERT INTO invitations(id,walk_id,sender_id,recipient_id) VALUES('seed-walk-invite','seed-active-walk','demo-brian','demo-amina')").run();
    db.prepare("INSERT INTO messages(id,walk_id,user_id,body,created_at) VALUES('seed-message','seed-active-walk','demo-brian','Heading back from the library. Want to join? ',datetime('now','-4 minutes'))").run();
  }
  if(!db.prepare('SELECT 1 FROM walks WHERE id=?').get('seed-history-walk')) {
    db.prepare("INSERT INTO walks(id,owner_id,origin_id,destination_id,status,created_at,ended_at) VALUES('seed-history-walk','demo-amina','library','cafeteria','completed',datetime('now','-1 day'),datetime('now','-1 day','+12 minutes'))").run();
    db.prepare("INSERT INTO walk_participants(walk_id,user_id,sharing_enabled,status) VALUES('seed-history-walk','demo-amina',0,'left')").run();
    db.prepare("INSERT INTO walk_participants(walk_id,user_id,sharing_enabled,status) VALUES('seed-history-walk','demo-grace',0,'left')").run();
  }
});
seed();
if(process.argv[1]?.endsWith('seed.js'))console.log('Seed data is ready. Demo login: amina@demo.gu.ac.ug / Walk1234');
