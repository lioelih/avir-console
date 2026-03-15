# Avir Console

A local party game platform: host opens a lobby, players join from their phones (as controllers), and the game runs in the browser (SNES emulator). Built for in-person play on the same Wi‑Fi.

## What’s in this repo

- **Lobby server** — HTTP + WebSocket server. Create rooms, get a join link and QR code, see who’s in the lobby, start a game.
- **Lobby page** — For the host: create room, show QR/link, player list, game select, start game.
- **Controller page** — For players: open via link (or QR), enter name, use an SNES-style gamepad (D-pad, A, B, X, Y, Start, Select, L, R) to send input.
- **E2E mocks** — In-process test harness that runs the full flow (create lobby → join → select game → input) without real devices. Use as a regression check.

Design, architecture, and message contracts are in `.cursor/notes/dev-flow-steps-1-2.md`. Current work is tracked in `.cursor/contracts/`.

## Requirements

- Node.js (v18+ for `fetch` in the mock script)
- npm

## Install

```bash
npm install
```

## Run the lobby server

```bash
npm run start:lobby
```

- Lobby (host): **http://localhost:3001**
- Controller (players): **http://localhost:3001/controller?room=ROOM-xxx** (room ID from the lobby after creating a room)

Port can be overridden with `PORT=3002 npm run start:lobby`. The server uses the machine’s LAN IP for the join URL so phones on the same network can open the controller page.

## Run the E2E mock test

```bash
npm run run-e2e-mocks
```

Runs the full mock flow and exits 0 on success. Use this to confirm the message flow still works after changes.

## Flow (current)

1. Host opens the lobby page and clicks **Create room**.
2. Lobby shows a join URL and QR code. First person to join (via that link) becomes the host (P1).
3. Other players open the same link (or scan the QR), enter a name, and join as P2–P4.
4. Host selects a game on the lobby page and clicks **Start game**.
5. Controller page shows an SNES-style pad; button presses are sent to the server (for a future game/emulator client).

## License

ISC
