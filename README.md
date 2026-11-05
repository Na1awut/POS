<div align="center">

<img src="public/images/logo.svg" alt="POS Plus logo" width="120"/>

# POS+

**A full-stack point of sale system for restaurants and small shops**

</div>

POS+ combines a customer and cashier ordering screen with an admin back office for products, orders, expenses, tax and reports. It can also run as an Android app and print receipts on Sunmi devices.

## Features

- **Ordering:** menu, cart, order confirmation and printed receipts
- **Admin back office:** dashboard, orders, products and categories
- **Finance:** expenses, tax records and reports
- **Receipt designer:** create and preview receipt templates
- **AI assistant endpoint:** optional features powered by Groq
- **Android:** a Capacitor build with Sunmi printer support
- **Personalization:** color themes, with English and Thai translations

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts |
| Backend | Node.js, Express, TypeScript, JWT |
| Database | PostgreSQL 15 |
| Mobile | Capacitor |

## Getting started

Node.js 18+ and Docker are recommended.

**1. Start the backend**

```bash
cd server
cp .env.example .env
docker compose up -d
npm install
npm run migrate
npm run seed
npm run dev
```

The API runs on <http://localhost:3001>. To use AI features, add `GROQ_API_KEY` to `server/.env`.

> `npm run seed` replaces menu data and creates a default `admin` account with the password `admin123`. Change this password before any shared or production use.

**2. Start the frontend**

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The back office is at `/admin`. To use another API, set `VITE_API_URL`.

## Commands

| Location | Command | What it does |
|---|---|---|
| Root | `npm run dev` | Start the frontend |
| Root | `npm run build` | Type-check and build |
| Root | `npm run lint` | Run ESLint |
| `server/` | `npm run dev` | Start the API with reload |
| `server/` | `npm run build` | Compile the API |
| `server/` | `npm start` | Migrate, then run the compiled API |
| `server/` | `npm run reset-orders` | Run the order reset script |

## Android

```bash
npm run build
npx cap sync android
npx cap open android
```

The `android/` project is not stored in this repository, so run `npx cap add android` once first. Update `allowNavigation` in `capacitor.config.ts` to match your API host.

## Project structure

```text
src/             React app
  admin/         Back office pages and API client
  components/    Ordering UI
  i18n/          English and Thai translations
  utils/         Receipt printing and helpers
server/src/
  routes/        API routes
  models/        Database schema
  config/        Database connection and migration
  seed/          Seed data
public/images/   Logo and menu images
```

## Credits

This project builds on POSplus by [fireDevelop](https://firedevelop.com). Released under the [MIT License](LICENSE).
