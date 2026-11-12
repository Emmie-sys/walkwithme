import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './database.js';

const folder=path.join(path.dirname(fileURLToPath(import.meta.url)),'migrations');
db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
for(const name of fs.readdirSync(folder).filter(name=>name.endsWith('.sql')).sort()) {
  if(db.prepare('SELECT 1 FROM schema_migrations WHERE name=?').get(name))continue;
  const sql=fs.readFileSync(path.join(folder,name),'utf8');
  db.transaction(()=>{db.exec(sql);db.prepare('INSERT INTO schema_migrations(name) VALUES(?)').run(name);})();
  console.log(`Applied migration ${name}`);
}
