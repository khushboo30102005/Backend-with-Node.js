# SFECAPP — Smart File & Ephemeral Collaboration System

> **Manage Smarter. Collaborate Temporarily.**

SFECAPP is a secure file storage and collaboration platform: personal file storage
("My Drive"), viewer/editor sharing, self-expiring **ephemeral workspaces**,
optional AI file insights, and a one-time Premium storage upgrade.

## Project layout

| Folder | What it is |
|---|---|
| `Client/` | React + Vite frontend (deployed to Vercel) |
| `Server/` | Node.js + Express API (deployed to Render), MongoDB, Redis, Backblaze B2 |

## Getting started

```bash
# API
cd Server
npm install
npm run setup      # one time: collections and indexes
npm run dev

# Frontend
cd Client
npm install
npm run dev
```

Run the server tests with `npm test` in `Server/`, and build the frontend with
`npm run build` in `Client/`.

## Further documentation

- [EPHEMERAL_WORKSPACE.md](EPHEMERAL_WORKSPACE.md): workspace lifecycle, data model and cleanup policies
- [AI-FEATURE-SETUP.md](AI-FEATURE-SETUP.md): AI file insights and smart search setup
- [PAYMENTS.md](PAYMENTS.md): Razorpay Premium purchase (Test Mode)

## Branding

User-facing brand strings live in `Client/src/brand.js` and `Server/config/brand.js`.
Keep the two files in sync. Internal identifiers (package names, routes such as
`/mydrive`, database, bucket and cookie names) are deliberately left unchanged.
