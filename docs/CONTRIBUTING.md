# Contributing

## Change boundaries

- Keep visual tokens in `shared/src/theme.ts` and prefer the common controls in `shared/src/components/ui.tsx`.
- Screens call named functions from `shared/src/api/index.ts`; HTTP headers, base URL and response parsing stay in `api/http.ts`.
- Keep platform-specific permissions and native configuration under `apps/ios` or `apps/android`. Share user-facing business behavior unless the platform genuinely differs.
- Put walk lifecycle rules in `backend/src/services/walks.js`; HTTP parsing and status codes belong in routes. Never rely on a hidden mobile control for authorization.
- Add database changes as the next numbered SQL file under `backend/src/db/migrations/`. Applied migrations are immutable. Keep seed operations fictional and idempotent.

## Documentation and comments

Document module boundaries, non-obvious safety decisions, permission behavior, data ownership, migration assumptions and any intentionally simulated behavior. Prefer comments that explain why a boundary exists over comments that repeat the next line of code. Update README and the relevant API/privacy document when behavior changes.

## Local setup

Follow the root README to install dependencies, set a local `.env`, start the API, and launch either platform shell. Do not commit `.env`, SQLite files, credentials, student data, signing materials, or provider keys.

## Review checklist

- Are new API reads and writes authenticated and authorized server-side?
- Is sharing explicit, time-limited, visible to the user, and stopped by the server at session end?
- Does every external integration have a replaceable boundary and a documented failure path?
- Are user-facing statements accurate about what was delivered or contacted?
- Are schema changes forward-only and documented?
- Do both iOS and Android entry points still use the shared feature package?
