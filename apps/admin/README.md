# Walk with Me Admin

This is a separate React web app for university administrators. It does not share authentication storage with the mobile apps. Student and transporter accounts are denied by the admin API, and admin accounts are denied by the student mobile login and mobile API.

## Local development

1. From the repository root, install workspaces with `npm install`.
2. Start the API with `npm run dev:api`.
3. Create an administrator from the repository root with `npm --workspace backend run admin:create`. The command prompts for an admin email and a 14-character minimum password; it does not create a preset account.
4. Copy `.env.example` to `.env.local` if the API is not at `http://localhost:4000/api`.
5. Start the portal with `npm run dev:admin`, then visit `http://localhost:5174`.

Admin sessions are stored in `sessionStorage` and expire after eight hours. Use HTTPS and university-managed credentials for any shared environment. Only add emergency contact records after confirming their phone numbers with the university. Safe spots are created as pending and must be verified before the student app publishes them.

The mobile contact-matching flow uses a local development OTP when `PHONE_OTP_DEVELOPMENT=true`. Production SMS requests return unavailable until the university chooses and configures its SMS provider adapter; development codes must never be used for real account verification.

The map location fields currently accept latitude/longitude. Map selection and a production tile provider/API key should be configured before operational rollout; no real Gulu safe-location data is included in this prototype.
