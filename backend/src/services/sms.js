import { db } from '../db/database.js';

/** Replace this development adapter with the university-approved SMS provider. */
export const smsService={
  async sendVerificationCode({phoneE164,code}){
    if(process.env.NODE_ENV==='production')throw Object.assign(new Error('Phone verification provider is not configured.'),{status:503});
    if(process.env.PHONE_OTP_DEVELOPMENT!=='true')throw Object.assign(new Error('Development phone verification is disabled.'),{status:503});
    // Do not log the code or recipient. Local clients receive the code explicitly for testing.
    return {developmentCode:code};
  },
  cleanupExpired(){return db.prepare('DELETE FROM phone_verification_challenges WHERE expires_at<=?').run(new Date().toISOString()).changes;},
};
