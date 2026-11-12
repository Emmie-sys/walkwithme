import { config } from '../../config.js';

/** Development gate only; an email-domain match is not proof of current student status. */
export const domainAllowlistProvider={
  accepts(email){return config.studentDomains.some(domain=>String(email).toLowerCase().endsWith(`@${domain}`));},
};
