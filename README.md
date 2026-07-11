# Elite Search & Rescue AI Dispatcher

A tactical command center for disaster response that turns raw, unstructured field reports into actionable rescue intelligence in real time.

Built as part of an AI boot camp organized by Google.
## 📺 Demonstration Video
Watch the [Elite Search & Rescue AI Dispatcher Demo Video](https://youtu.be/fOSkntCLWSM) to see the system in action.

## Overview

During a disaster, first responders are flooded with noisy, unstructured data — radio chatter, social media posts, field reports — and every minute spent manually parsing it is a minute not spent saving lives.

The **Elite Search & Rescue AI Dispatcher** is a joint operations cockpit that ingests raw disaster feeds, uses an AI-powered analysis engine to extract critical information (coordinates, signs of life, hazards, victim estimates, and extraction priority), and gives commanders a live tactical map and dispatch board to mobilize rescue squads accordingly.

## Features

- **Feed Ingestion** — Load preset disaster scenarios or submit custom raw-text field reports from any source.
- **AI-Powered Analysis** — Each feed is parsed by an AI dispatch engine that extracts:
  - Precise GPS coordinates
  - Signs of life detection with confidence scoring
  - Hazard identification and proximity threats
  - Victim count estimates
  - Extraction priority and dispatch recommendation
- **Tactical Map** — Live map visualization of every active incident and rescue squad relative to base HQ.
- **Squad Dispatch Board** — Mobilize specialized squads (K9 Search, Heavy Rescue, Medical Support, Drone Recon, HAZMAT Tactical) with simulated real-time movement and ETA tracking to the incident site.
- **Operational Terminal** — A running, timestamped log of every system event and operator action, for a full audit trail of the response.
- **Persistent State** — Feeds, squad status, and logs persist across sessions via local storage.
- **Full Reset** — One-click reset to clear all feeds, squads, and logs and return to a clean operational state.

## Tech Stack

- **React** + **TypeScript**
- **Tailwind CSS**
- **Lucide React** (icons)
- AI-powered feed analysis via a server-side API endpoint (Gemini)

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env) to your Gemini API key
3. Run the app:
   `npm run dev`
4. Open the app in `http://localhost:3000/`

## Project Structure

```
├── src/
│   ├── bkup/                  # Backup files
│   ├── components/            # UI components (TacticalMap, FeedList, ActiveDispatchBoard, OperationalTerminal, etc.)
│   ├── App.tsx                # Root application component and state management
│   ├── index.css               # Global styles
│   ├── main.tsx                 # Application entry point
│   ├── presets.ts               # Preset disaster feed scenarios
│   └── types.ts                  # Shared TypeScript types (feeds, teams, logs, analysis results)
├── .env                        # Environment variables (Gemini API key, etc.)
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── server.ts                   # Server-side API endpoint (feed analysis)
├── tsconfig.json
└── vite.config.ts
```

## Disclaimer

This is a prototype/demo application built for an AI boot camp and is not intended for use in real emergency response operations.
