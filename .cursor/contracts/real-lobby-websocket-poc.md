# Real Lobby Server and WebSocket API (PoC)

**Status:** draft  
**Goal:** A real Lobby server runs locally, accepts WebSocket connections, and handles the same message contracts (joinLobby, lobbyJoinAck, lobbyState, selectGame, gameStarting) as the mocks, so real controller and lobby UIs can connect over the network.

## Contract Rules

Global rules only.

## Context

- `.cursor/notes/dev-flow-steps-1-2.md` Steps 6–8 (architecture, message contracts).
- `.cursor/notes/e2e-mock-message-flow.md` — same message shapes; real server must speak them.
- E2E mocks (`e2e-mocks/`, `npm run run-e2e-mocks`) remain the regression check; this contract adds a **real** server and optional real client page.

## Execution Strategy

1. Implement a single Node process that runs a Lobby server with:
   - HTTP: optional catalog or health; and a way to create a room (or first WebSocket join creates it per design).
   - WebSocket: one endpoint (e.g. `/room/:roomId` or `/ws`) where clients connect and send/receive JSON messages (joinLobby, lobbyJoinAck, lobbyState, selectGame, gameStarting).
2. Reuse the same in-memory Room/Player logic as the Lobby mock (or share types) so behavior matches.
3. For PoC, Execution can remain a mock: when host selects a game, Lobby calls the same `startGameSession` on a mock or stub and broadcasts `gameStarting` to all clients.
4. Optional: minimal controller web page (static HTML/JS) that opens a WebSocket to the Lobby, sends joinLobby with a name, and displays lobbyJoinAck and lobbyState.
5. Keep `npm run run-e2e-mocks` passing (mocks are unchanged; real server is a separate entry point).

## Tasks

- [ ] Define real Lobby server entry point (e.g. `src/lobby-server.js` or `server/lobby.js`) and port config.
- [ ] Implement WebSocket server (e.g. `ws` package) that accepts connections and parses JSON messages by `type`.
- [ ] Implement joinLobby handler: create room if needed, assign slot/role, return lobbyJoinAck and broadcast lobbyState to all clients in the room.
- [ ] Implement selectGame handler (Host only): transition room to executing, call Execution stub (mock) startGameSession, broadcast gameStarting.
- [ ] (Optional) Implement input forwarding: when room is executing, forward `input` messages to Execution stub and log (for latency visibility).
- [ ] Optional: add minimal controller page (static) that connects via WebSocket, joins with a name, shows ack and state.
- [ ] Validate: run mock E2E (green); run real server and manually or scripted connect a client, join, select game, verify messages.
- [ ] Tune (blue)
- [ ] Validate (green)

## Test Matrix

| Layer       | Required? (Y/N) | Notes                                        |
|------------|------------------|----------------------------------------------|
| Unit       | N               | Can add for room/player logic if shared.     |
| Integration| Y               | WebSocket client sends join → receives ack.  |
| Contract   | Y               | Message shapes match dev-flow Step 8.        |
| E2E        | Y               | Mock E2E stays green; real flow manual/scripted. |
| Concurrency| N               |                                               |
| Security   | N               | PoC local only.                              |

## Acceptance Criteria

- Given the real Lobby server is running, when a client connects via WebSocket and sends joinLobby with roomId and name, the client receives lobbyJoinAck (with slot/role) and lobbyState is broadcast to all clients in that room.
- When the host sends selectGame with a gameId, the room transitions to executing, Execution (stub) receives startGameSession, and all clients receive gameStarting.
- Running `npm run run-e2e-mocks` still passes (no regression).

## Notes

2025-03-12 — Contract created; first slice of real project after E2E mocks complete.
