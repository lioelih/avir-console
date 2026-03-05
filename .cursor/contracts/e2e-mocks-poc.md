# E2E Mocks for PoC Services

**Status:** draft  
**Goal:** A basic end-to-end test harness using mocks for Distribution, Lobby, Execution, and Controllers is in place and can run a simulated game flow without real emulators or phones.

## Contract Rules

Global rules only.

## Context

- See `.cursor/notes/dev-flow-steps-1-2.md` Steps 3–8 for architecture and message contracts.
- This contract focuses on creating small, focused mocks for:
  - Distribution Service (catalog + lobby creation),
  - Lobby Service (room + players, without real emulator),
  - Execution Service (fake game runtime),
  - Controller clients (virtual phones).

## Execution Strategy

Start from the message contracts (Step 8) and implement thin, in-memory versions of each service that can be run locally. Use them to verify:

- join/rejoin flows,
- host/guest role assignment,
- game selection → execution handoff,
- routing of input events.

Keep mocks minimal but wired together end-to-end so they can be used as a regression tool while the real emulator integration is being built.

## Tasks

- [ ] Design mock message flows for one happy-path room:
      - Host creates lobby,
      - P1 and P2 join as controllers,
      - Host selects a SNES game,
      - Execution mock receives and logs input events.
- [ ] Implement in-memory mock Distribution:
      - Hard-coded catalog with 1–2 SNES games,
      - Simple "create lobby" that returns a room id and mock lobby endpoint.
- [ ] Implement mock Lobby:
      - In-memory `Room` and `Player` model,
      - Handlers for `joinLobby`, `lobbyState`, `selectGame`, `gameStarting`,
      - No real emulator start, just a fake call to Execution mock.
- [ ] Implement mock Execution:
      - Accepts `startGameSession` and `input` events,
      - Logs input per player/slot and basic "gameState",
      - No real rendering, just console/log output.
- [ ] Implement mock Controllers:
      - A simple script/page that:
        - simulates 2 players joining,
        - sends a scripted sequence of `input` events (e.g., press A, move D-pad).
- [ ] Wire everything into a single "mock e2e run" script:
      - Starts Distribution/Lobby/Execution mocks in one process,
      - Runs the scripted controller sequence,
      - Verifies expected logs/states are produced.
- [ ] Validate (green)
- [ ] Tune (blue)
- [ ] Validate (green)

## Test Matrix

For this contract, explicitly choose which layers from the global Test Matrix are in scope and ensure they are covered by the mocks or by tests built on top of them.

| Layer       | Required? (Y/N) | How it is exercised in the mocks          |
|------------|------------------|-------------------------------------------|
| Unit       |                  |                                           |
| Integration|                  |                                           |
| Contract   |                  |                                           |
| E2E        |                  | Likely **Y** (end-to-end mock scenario). |
| Concurrency|                  |                                           |
| Security   |                  |                                           |

## Acceptance Criteria

- Given the mock services are running locally, when a scripted scenario runs:
  - Host lobby is created,
  - P1 and P2 join with unique names and receive correct slots/roles,
  - Host selects a game and Lobby transitions the room to executing,
  - Execution mock receives `startGameSession` with the right players,
  - Execution mock receives `input` events tagged with correct roomId, playerId, and slot,
- Then the logs/state snapshot show the full flow without errors, and this can be rerun as a simple regression check.

## Notes

{YYYY-MM-DD HH:MM} — Contract created.

