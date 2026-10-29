# Walk with Me (MVP prototype)
A frontend-only, illustrative student walking-coordination prototype for Gulu University. Not an official or university-endorsed product.

## Features
Welcome + simulated sign-in/registration, home dashboard, create-walk flow, active walk with local SVG map (zoom, recenter, simulated progress), chat, invitations, friends (search, requests, remove), notifications, history, privacy centre, simulated emergency flow, reset of demo data.

## Structure
`index.html`, `styles.css`, `app.js`, `assets/logo.svg`

## Run locally
`python3 -m http.server` in this folder, then open http://localhost:8000 (or open index.html directly).

## Deploy to GitHub Pages
Push to a repo, then Settings > Pages > deploy from branch `main`, folder `/ (root)`. All paths are relative; no build step.

## Demo account
`amina@demo.gu.ac.ug` / `Walk1234` (fictional). You can also register; accounts live in localStorage only.

## How the simulation works
State lives in one JS object, saved to localStorage (corrupt or missing data falls back to seed data). A timer advances route progress; friend positions trail yours along an illustrative route. Invitations, acceptances and messages are generated locally.

## Simulated, not real
Authentication, email/student verification, invitations to real people, chat, location sharing, and the emergency alert. SOS contacts nobody and no emergency numbers are included. The map is a locally drawn illustration; no external services or API keys are used, so there are no network dependencies.

## Privacy and security limits
Client-side checks are not secure authentication. Passwords in demo data sit in localStorage in plain text. Privacy toggles demonstrate behaviour; they are not enforceable boundaries. The browser geolocation API is never used.

## Needed for production
Server-side auth and verified university identity, authorization on every location read, encrypted transport and storage, real-time messaging/location channels, verified security and emergency contacts, push notifications, abuse controls, audit logs, retention policy, accessibility and security review, and real geographic data.
