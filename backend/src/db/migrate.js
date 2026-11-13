import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './database.js';

const folder=path.join(path.dirname(fileURLToPath(import.meta.url)),'migrations');
db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
for(const name of fs.readdirSync(folder).filter(name=>name.endsWith('.sql')).sort()) {
  if(db.prepare('SELECT 1 FROM schema_migrations WHERE name=?').get(name))continue;
  const sql=fs.readFileSync(path.join(folder,name),'utf8');
  db.transaction(()=>{
    // SQLite has no portable ADD COLUMN IF NOT EXISTS. Inspect column additions so
    // a partially applied local prototype migration can be repaired safely.
    for(const statement of sql.split(';').map(value=>value.trim()).filter(Boolean)){
      const alter=statement.match(/ALTER\s+TABLE\s+([A-Za-z_][\w]*)\s+ADD\s+COLUMN\s+([A-Za-z_][\w]*)/i);
      if(alter&&db.prepare(`PRAGMA table_info(${alter[1]})`).all().some(column=>column.name===alter[2]))continue;
      db.exec(statement);
    }
    db.prepare('INSERT INTO schema_migrations(name) VALUES(?)').run(name);
  })();
  console.log(`Applied migration ${name}`);
}
