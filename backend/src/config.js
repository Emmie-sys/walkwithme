import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') });
export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '0.0.0.0',
  databasePath: path.resolve(process.env.DATABASE_PATH ?? path.resolve(here, '../data/walkwithme.sqlite')),
  jwtSecret: process.env.JWT_SECRET ?? 'local-only-change-this-secret-before-deployment',
  studentDomains: (process.env.STUDENT_EMAIL_DOMAINS ?? 'gu.ac.ug').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),
  demoLogin: process.env.ALLOW_DEMO_LOGIN !== 'false',
};
