# E2E Mocks — What We Built and What You’re Learning

This doc summarizes the implementation and explains the ideas in plain language (no unexplained buzzwords). It’s written for someone learning how real projects are designed and run.

---

## What we did (high level)

We built a **fake version** of the full system (Distribution → Lobby → Execution + Controllers) that:

1. Runs in **one Node process** (no real phones, no real SNES emulator).
2. Follows the **same message shapes** as the real design (so when we plug in the real services later, the flow is already proven).
3. Can be **run with one command** (`npm run run-e2e-mocks`) and **checks itself**: if the flow breaks, the script exits with an error.

So: we implemented a **simulated end-to-end flow** and a **regression check** you can rerun anytime.

---

## Files we added and what each one does

| File | What it is | What it does in plain English |
|------|------------|-------------------------------|
| **`e2e-mocks/execution-mock.js`** | Mock “game runtime” | Doesn’t run a real game. It only **receives** two kinds of things: “game started with these players” and “player X pressed button Y.” It **logs** them (and keeps a list in memory so the run script can check them). In the real product, this would be the thing that talks to the SNES emulator. |
| **`e2e-mocks/lobby-mock.js`** | Mock “lobby / room manager” | Holds **in-memory** rooms and players (no database). It can: **create a room**, **let players join** (first = host, next = guests), **let the host pick a game** (then it tells the Execution mock “game started”), and **forward button presses** to the Execution mock once the game has started. So it’s the “middle” piece that coordinates who’s in the room and when the game starts. |
| **`e2e-mocks/distribution-mock.js`** | Mock “catalog + lobby creator” | A small **HTTP server** (using Express). It serves: (1) **GET /api/games** — a fixed list of 2 SNES games; (2) **POST /api/lobbies** — “create a lobby” which really just asks the Lobby mock to create a room and returns a `roomId` and a fake URL. So it’s the **entry point** the “host” would hit first in a real app. |
| **`e2e-mocks/controller-script.js`** | Script that pretends to be two phones | A **script** (not a human). It: (1) calls the Distribution API over HTTP to create a lobby and get `roomId`; (2) calls the Lobby mock directly (same process) to “join” as Alice (P1) and Bob (P2); (3) tells the Lobby “host selected this game”; (4) sends a few fake button events (P1: A down/up, P2: DPadUp down/up) through the Lobby into the Execution mock. So it **automates** the happy path. |
| **`e2e-mocks/run-e2e.js`** | “Run the whole thing and check it” | **Orchestrator**: it creates the three mocks, wires them (Lobby knows about Execution, Distribution knows about Lobby), starts the HTTP server, runs the controller script, then **asserts** that the Execution mock received the right stuff (one “game started” with 2 players, and at least one input from P1 and one from P2). If anything fails, it exits with code 1 so you can use it as a **regression test**. |

**`package.json`** — We added the script **`run-e2e-mocks`** so you can run the flow with:

```bash
npm run run-e2e-mocks
```

---

## Concepts decoded (what the buzzwords mean here)

- **E2E (end-to-end)**  
  The whole path from “create lobby” to “game receives button presses.” We’re testing that path in one go, not one function at a time.

- **Mock**  
  A **stand-in** that behaves like the real thing only enough for our purpose. Our “Execution” doesn’t run a game; it only logs “game started” and “input received.” That’s enough to prove the **flow** works.

- **In-memory**  
  Data (rooms, players) lives only in JavaScript objects and `Map`s. When the process exits, it’s gone. No database. Used so the mocks are simple and fast.

- **HTTP API**  
  Distribution mock uses **HTTP**: you do `GET /api/games` or `POST /api/lobbies` and get JSON back. That’s the same idea as “REST” or “web API” — the client (here, our script) talks to the server with requests and responses.

- **Message contract / message shape**  
  We agreed up front what each message looks like (e.g. `joinLobby` with `roomId`, `name`, `reconnectToken`). The mocks use those **exact shapes** so that when we replace mocks with real services, we don’t have to redesign the flow.

- **Regression (regression check)**  
  “If we change code later, did we break the happy path?” Running `npm run run-e2e-mocks` answers that. If it passes, the full flow still works; if it fails, something we did broke it.

- **Orchestration / wiring**  
  `run-e2e.js` **creates** the mocks and **connects** them (e.g. Lobby gets a reference to Execution so it can call `execution.startGameSession(...)` and `execution.input(...)`). That “who calls whom” setup is the **wiring**; doing it in one place is **orchestration**.

- **Assertion**  
  A check that must be true or we fail. In `run-e2e.js` we assert things like “Execution’s logs contain a startGameSession with 2 players” and “there is at least one input from slot 1 and one from slot 2.” If any assertion fails, we `process.exit(1)` so the run is **red** (failed).

---

## Design and workflow (how this mirrors “real” projects)

1. **Design before code**  
   We had the **message flow** (in `.cursor/notes/e2e-mock-message-flow.md`) and the **contract** (tasks and acceptance criteria) before writing implementation. That’s how teams avoid building the wrong thing.

2. **One responsibility per piece**  
   - Distribution: catalog + “create lobby” (HTTP).  
   - Lobby: rooms, players, who’s host, when the game starts, forward input.  
   - Execution: receive “game started” and “input,” log them.  
   Each file has a **single job**; that’s **separation of concerns**.

3. **Dependencies go in one direction**  
   Distribution depends on Lobby (it calls `lobby.createRoom()`). Lobby depends on Execution (it calls `execution.startGameSession` and `execution.input`). Execution depends on nothing. So we have a clear **dependency flow** and no circular “A needs B, B needs A.”

4. **Testable from the outside**  
   The controller script only uses: (a) HTTP to Distribution, and (b) the Lobby’s public functions. It doesn’t reach inside and mess with private state. That’s the idea of **testing through the public interface** — like a real client would use the system.

5. **Contract-driven**  
   The work was defined in a **contract** (goal, tasks, acceptance criteria). We implemented until the acceptance criteria were met, then marked tasks done. That’s a small version of **agreement-first** delivery: “done” is defined before we code.

---

## How to run it and what “success” looks like

From the project root:

```bash
npm run run-e2e-mocks
```

You should see:

- Log lines like `[Execution] startGameSession ...` and `[Execution] input slot=1 A down` (etc.).
- A final line: `--- E2E passed: lobby created, P1/P2 joined, game selected, input received ---`
- Process exits with code 0 (success).

If something is broken (e.g. you change Lobby and forget to forward input), the script will exit with code 1 and print what failed. That’s your **regression check**.

---

## What you can say in an interview or on a resume

- “We built an **end-to-end test harness** with **mocks** for each service, so we could run the full flow without real devices or an emulator.”
- “We followed **message contracts** from the design doc and used **in-memory** mocks and a **scripted client** to automate the scenario.”
- “The run script **orchestrates** the mocks and **asserts** on the Execution logs, so we have a **regression test** we can run in one command.”

You’ve touched: **E2E testing**, **mocking**, **HTTP APIs**, **orchestration**, **contracts**, and **regression** — all terms used in real industry workflows.
