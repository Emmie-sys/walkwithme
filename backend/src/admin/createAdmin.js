import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import '../db/migrate.js';

const rl=createInterface({input,output});
try {
  const name=(await rl.question('Administrator name: ')).trim();
  const email=(await rl.question('Administrator email: ')).trim().toLowerCase();
  const password=await rl.question('Initial password (minimum 14 characters): ');
  if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<14)throw new Error('Enter a valid name, email and password with at least 14 characters.');
  if(db.prepare('SELECT 1 FROM users WHERE email=? COLLATE NOCASE').get(email))throw new Error('An account already uses that email.');
  const id=randomUUID(),hash=await bcrypt.hash(password,12);
  db.transaction(()=>{db.prepare("INSERT INTO users(id,name,email,student_id,password_hash,role) VALUES(?,?,?,? ,?,'admin')").run(id,name,email,`ADMIN-${id.slice(0,8)}`,hash);db.prepare('INSERT INTO settings(user_id) VALUES(?)').run(id);})();
  output.write(`Created admin account ${email}. Keep the password in the university password manager.\n`);
} finally {rl.close();db.close();}
