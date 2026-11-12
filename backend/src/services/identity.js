import { domainAllowlistProvider } from '../providers/identity/domainAllowlistProvider.js';

/** Replace the local domain check with a university identity integration when approved. */
export const identityService={isUniversityEmailAllowed:email=>domainAllowlistProvider.accepts(email)};
