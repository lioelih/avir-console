# E2E Mock — Happy-Path Message Flow

One room, host creates lobby, P1 and P2 join as controllers, host selects a SNES game, then controllers send input; Execution mock receives and logs everything. Message shapes follow `.cursor/notes/dev-flow-steps-1-2.md` Step 8.

---

## Phase 1: Lobby creation

| Step | Actor | Action | Message / API |
|------|--------|--------|----------------|
| 1.1 | Test runner / Host | Create lobby | `POST /api/lobbies` (to Distribution mock) |
| 1.2 | Distribution | Response | `{ lobbyUrl, roomId }` (e.g. `roomId: "ROOM-MOCK-1"`) |

The test runner (or mock “host”) will use `roomId` and the mock Lobby endpoint for all subsequent steps.

---

## Phase 2: Controllers join (P1 = host, P2 = guest)

| Step | Actor | Action | Message |
|------|--------|--------|---------|
| 2.1 | Controller 1 (P1) | Join lobby | → Lobby: `{ type: "joinLobby", roomId, name: "Alice", reconnectToken: null }` |
| 2.2 | Lobby | Ack | → Controller 1: `{ type: "lobbyJoinAck", roomId, playerId, slot: 1, role: "host", token, error: null }` |
| 2.3 | Lobby | Broadcast state | → All (Lobby UI + controllers): `{ type: "lobbyState", roomId, phase: "lobby", players: [Alice P1 host], selectedGameId: null }` |
| 2.4 | Controller 2 (P2) | Join lobby | → Lobby: `{ type: "joinLobby", roomId, name: "Bob", reconnectToken: null }` |
| 2.5 | Lobby | Ack | → Controller 2: `{ type: "lobbyJoinAck", roomId, playerId, slot: 2, role: "guest", token, error: null }` |
| 2.6 | Lobby | Broadcast state | → All: `{ type: "lobbyState", roomId, phase: "lobby", players: [Alice P1 host, Bob P2 guest], selectedGameId: null }` |

---

## Phase 3: Host selects game → Execution handoff

| Step | Actor | Action | Message |
|------|--------|--------|---------|
| 3.1 | Lobby UI (Host) | Select game | → Lobby: `{ type: "selectGame", roomId, playerId: "<P1-id>", gameId: "snes-mario-world" }` |
| 3.2 | Lobby | Start Execution session | → Execution mock: `{ type: "startGameSession", roomId, gameId: "snes-mario-world", players: [{ id, name: "Alice", slot: 1 }, { id, name: "Bob", slot: 2 }] }` |
| 3.3 | Lobby | Notify all | → All: `{ type: "gameStarting", roomId, gameId: "snes-mario-world" }` |
| 3.4 | Lobby | (optional) | Room `phase` → `"executing"`; subsequent input goes to Execution |

---

## Phase 4: Controllers send input → Execution logs

| Step | Actor | Action | Message |
|------|--------|--------|---------|
| 4.1 | Controller 1 | Button down | → Execution (or via Lobby): `{ type: "input", roomId, playerId, slot: 1, control: "A", action: "down", value: null, clientTime? }` |
| 4.2 | Controller 1 | Button up | → Execution: `{ type: "input", roomId, playerId, slot: 1, control: "A", action: "up", value: null }` |
| 4.3 | Controller 2 | D-pad | → Execution: `{ type: "input", roomId, playerId, slot: 2, control: "DPadUp", action: "down" }` then `"up"` |

Execution mock only needs to **receive** these and **log** them (e.g. `[Execution] input P1 A down`, `[Execution] input P2 DPadUp down`). No real emulator.

---

## Transport (for mocks)

- **Distribution:** HTTP only (`GET /api/games`, `POST /api/lobbies`).
- **Lobby ↔ Controllers / Lobby UI:** In-process or in-memory “channel” (e.g. callbacks or event emitter) so the single “mock e2e run” script can drive controllers and assert on Lobby/Execution without real WebSockets. Same message shapes as Step 8.
- **Lobby ↔ Execution:** In-process call or message queue; Lobby sends `startGameSession` and forwards `input` to Execution.
- **Controllers:** Script that sends the above messages in order; no browser required.

---

## Success criteria for the run

After the script runs:

1. Lobby was created (roomId returned).
2. P1 and P2 joined and got `lobbyJoinAck` with slot 1/host and slot 2/guest.
3. Host selected a game; Lobby sent `startGameSession` to Execution with correct `roomId`, `gameId`, and players.
4. Execution received and logged at least one `input` per player (e.g. P1 A down/up, P2 DPadUp down/up).
5. No errors; logs or state snapshot can be asserted for regression.
