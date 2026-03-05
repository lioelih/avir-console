# Dev Flow — Steps 1–3 (dump)

This note captures the outcomes of Dev Flow Step 1 (problem framing), Step 2 (goal statement), and Step 3 (constraints & assumptions) for this project.

## Step 1 — Problem framing

**Project vision:** a local party game platform for in-person hangouts. Friends join a game room by scanning a QR code, and use their phones as controllers.

**Game execution model (updated):** the project does **not** focus on developing original games. Instead, it packages an emulator + specific game into a web app that runs in the **player’s browser** (WebAssembly/WebGL). A central service coordinates phone controllers and routes their input to the browser-based emulator.

**Scale (initial):** 2–4 players.

**Priority:** low latency is a high priority (feel should be good enough for real play, not just a tech demo).

## Step 2 — Goal statement

**Goal:** Build a local party-game controller platform where a host page shows a QR code, 2–4 players join from phones on the same network, and their inputs control a browser-based emulator with low perceived latency.

**Execution model:** for each game session, the user opens a game URL in their browser that:

- downloads and runs a WebAssembly/WebGL emulator + a specific ROM,
- connects to the controller server as “the emulator client” for a room,
- receives controller events from that room (P1, P2, etc.) and feeds them into the emulator.

Phones open a controller URL, join the same room, and send input events to the controller server, which forwards them to the emulator client.

**Deferred decision (architecture tracks):**

- **PoC:** use a simple, generic controller protocol over web APIs (e.g., WebSocket) with in-browser emulation; focus on correctness and acceptable latency first, not deep emulator APIs.
- **MVP:** add deeper emulator/game-aware integrations only if needed for better UX (player-slot awareness, per-game layouts, advanced features).

**Network assumption (now):** all phones and the browser running the emulator are on the same Wi‑Fi / local network. True “cloud rooms” are a later phase.

## Step 3 — Constraints & assumptions

**Host / runtime (high level):**

- PoC targets a **browser-based game runtime** (emulator + ROM in a client environment), not a native-only desktop app.
- There are three conceptual backend roles:
  - a **Distribution Server** that serves catalogs and static assets,
  - a **Lobby Server** that runs locally on the host machine and manages rooms before a game starts,
  - an **Execution Server** that runs locally on the host machine and owns the active game session and its inputs.

**Emulator choice (first):**

- Start with **SNES** via a browser-capable emulator (e.g., SNES core compiled to WebAssembly / Libretro-in-the-browser or similar).
- Initially support one specific game/ROM to keep the PoC tight.

**Controller model v1:**

- Universal SNES-like controller:
  - D‑pad,
  - A/B,
  - Start/Select,
  - L/R,
  - one analog stick (may initially behave like digital directions for SNES).
- Must support **hold behavior** (button/stick down & up), not just taps.
- Design the protocol so additional buttons/layouts can be added later without breaking existing clients.

**Players & identity:**

- 2–4 players per room.
- Each player enters a **unique name** on first join; duplicate names are rejected.
- First to join = **P1** (and controls menus), second = **P2**, etc.
- If a player refreshes, they should be recognized as the **same player** and reclaim their slot, via a short token stored on the client and validated on reconnect.

**Rooms & server responsibilities:**

- The server manages **rooms**, each with:
  - a unique `roomId`,
  - one emulator client connection (the browser running the game),
  - 2–4 controller client connections (phones),
  - player metadata (name, slot, connection state).
- API shape (conceptual):
  - `POST /rooms/:roomId/join-controller` — phones join the room as controllers.
  - `POST /rooms/:roomId/join-emulator` — browser game page joins as the emulator client.
  - `WS /rooms/:roomId` — real-time input and state messages.

**Latency measurement & target:**

- PoC uses **software timestamps** (no slow‑motion video for now):
  - log/measure times at: phone → server → emulator-client → emulator input.
- For subjective “is this good enough?” testing, visual feel will be used during play sessions; more advanced measurement methods can come later.
- Latency goal: after subtracting the baseline wired-controller latency for the same emulator/game, the **added latency from the phone-controller system** should be **≤ 20 ms**, with a preference to push lower over time.

**Mocks & test harness:**

- Implement **mocks on both sides** to simplify development and debugging:
  - Mock controllers: a local page or script that simulates multiple phones and sends deterministic input sequences.
  - Mock emulator client: a page/process that accepts the same input messages the real emulator client would, logs them, and optionally visualizes them, without running a real emulator.
- Keep mocks small and focused—just enough to:
  - test controller → server → emulator-client messaging without the real emulator,
  - reproduce latency and logic issues without full setup (phones, specific ROM, etc.).

## Step 4 — Personas & lobby

**Lobby:** the main room view the first user opens in their browser. The lobby shows:

- a **games menu** (list of available emulator+ROM packages),
- **player connection status** (who is connected, roles),
- a **QR code or link** so other players can join as controllers.

**Host Player:**

- The **first player who joins the room** becomes the **Host Player**.
- Only the Host Player can:
  - navigate and select games in the lobby menu,
  - start/stop a game.
- The Host can control the lobby and game using:
  - **keyboard + mouse** on the lobby machine, and/or
  - their **phone as a controller** once connected.

**Guest Players:**

- All players who join **after** the Host Player.
- They:
  - use their phones as controllers during gameplay,
  - cannot start/stop games or change the lobby menu.

**Remote Friend persona (deferred):**

- A “remote friend” who joins from another location over the internet is a **deferred decision** and explicitly **out of scope for the PoC**.
- Cloud-hosted rooms and fully remote sessions will be designed in a later phase.

## Step 5 — User stories (PoC)

**Story 1 — Host creates a lobby and starts a game**

- **As a** Host Player  
- **I want** to open a lobby page in my browser, see a games menu and a QR code, and select a SNES game to start  
- **So that** I can host a session where my friends join with their phones  
- **Given** I open the lobby URL  
- **When** I see the games menu and a QR code and I select a SNES game  
- **Then** a game room is created, the SNES emulator+ROM loads in my browser, and the lobby shows me as Host Player.

**Story 2 — Player joins lobby with phone and becomes Host Player**

- **As a** player arriving first  
- **I want** to scan the QR code, enter a unique name, and become Host Player (P1)  
- **So that** I can control the lobby menu and the game  
- **Given** the lobby is open and shows a QR code  
- **When** I scan the QR, open the controller page, and enter a unique name  
- **Then** I am assigned as Host Player (P1) and my phone can control the lobby/game.

**Story 3 — Guest players join as controllers**

- **As a** guest player  
- **I want** to scan the QR, enter a unique name, and join as a controller (P2–P4)  
- **So that** I can play using my phone  
- **Given** a lobby is open and already has a Host Player  
- **When** I scan the QR, open the controller page, and enter a unique name  
- **Then** I am added as a Guest Player (P2–P4) and see the universal controller UI, but I cannot change the games menu.

**Story 4 — Phones control the in-browser emulator**

- **As a** connected player (Host or Guest)  
- **I want** my phone’s controller UI to feel like a proper gamepad (buttons and holds)  
- **So that** the SNES game responds naturally to my inputs  
- **Given** a SNES game is running in the browser as the emulator client  
- **When** I press/hold/release D‑pad, A/B, Start/Select, L/R, or move the analog stick on my phone  
- **Then** the emulator receives the correct button/stick events for my player slot, and the game responds with acceptable additional latency (≤ 20 ms over wired baseline).

**Story 5 — Reconnect preserves identity**

- **As a** player who accidentally refreshes or closes the controller tab  
- **I want** to re-open the controller and keep my name and player slot  
- **So that** I don’t break the game or lose my position  
- **Given** I was already connected to a lobby as P1/P2/P3/P4  
- **When** I refresh the controller page and it reconnects with my stored token  
- **Then** I am reassociated with the same name and slot, not treated as a new player.

## Step 6 — Solution framing (architecture overview)

### Core backend roles

- **Distribution Server (global, long-lived)**  
  - Holds the **game catalog** (emulator+ROM packages and metadata).  
  - Serves static assets for **Lobby UI** and **Controller UI**.  
  - Provides a front end and APIs for **“Create Lobby”**, letting a user start a new session.

- **Lobby Server (local, temporary, on host machine)**  
  - Created when a user clicks **“Create Lobby”** via the Distribution front end.  
  - Manages a single **Lobby** for one room:
    - Shows the **game catalog** (fetched from Distribution).  
    - Displays **QR code / join link** and **connected players**.  
    - Assigns roles:
      - first controller → **Host Player (P1)**,  
      - subsequent controllers → **Guest Players (P2–P4)**.  
  - Provides a **real-time channel** during the lobby phase:
    - controllers connect as players,  
    - the host browser connects as the lobby UI.  
  - When the Host selects a game:
    - instantiates an **Execution Server** with the selected emulator+game package,  
    - connects all players to the Execution Server,  
    - transitions from catalog UI to “game in progress,”  
    - remains available for **routing/rejoin**, helping reconnecting players reattach to the active game session.

- **Execution Server (local, temporary, on host machine)**  
  - Owns a single **game session**:
    - starts the selected **game runtime** (emulator + ROM),  
    - outputs the **graphical game state** to the host’s display.  
  - Receives and processes **all player inputs**:
    - input messages originate from controllers (phones),  
    - are routed (via Lobby Server as needed) to the Execution Server,  
    - then translated into **actions** within the game/emulator.  
  - Maintains **player/session state** during gameplay (slots, connection state, reconnect info).

### Client-side roles

- **Lobby / Game Client (host browser)**  
  - Loaded initially from the **Distribution Server**.  
  - Talks to the **Lobby Server** during the lobby phase to:
    - render the catalog, QR code, and players list,  
    - send game selection actions from Host Player (via keyboard/mouse or phone).  
  - After a game is selected, binds to the **Execution Server** to:
    - host the **game runtime** (emulator + ROM),  
    - receive and apply input events for each player slot.

- **Controller Web App (phones, 2–4 players)**  
  - Loaded from the **Distribution Server** via QR/link.  
  - On load:
    - prompts for **player name**,  
    - connects to the current **Lobby Server** as a controller for that room,  
    - later may be redirected / rebound to the **Execution Server** when the game starts.  
  - Renders the **universal controller UI** (D‑pad, A/B, Start/Select, L/R, analog).  
  - Sends **input messages** describing button presses/holds and axis movements, always tagged with room + player identity, to whichever server is currently authoritative (Lobby for pre-game, Execution for in-game).

### High-level flow

1. **Lobby creation (Distribution → Lobby)**  
   - User opens the Distribution front end and clicks **“Create Lobby”**.  
   - Distribution Server starts or instructs starting a **Lobby Server instance** on the host.  
   - Lobby Server exposes a **Lobby URL** and `roomId`, loads the Lobby UI, and fetches the game catalog.

2. **Players join the Lobby**  
   - Phones scan the QR code / follow link to the **Controller Web App**.  
   - Controllers connect to the Lobby Server with a name and (optionally) reconnect token.  
   - Lobby Server assigns roles (Host Player P1, Guest Players P2–P4) and updates the Lobby UI.

3. **Host selects a game**  
   - Host (P1) navigates the catalog via keyboard/mouse or phone controller.  
   - On selection, Lobby Server:
     - identifies the chosen emulator+ROM package from Distribution data,  
     - starts an **Execution Server** instance for that game.

4. **Handoff to Execution Server**  
   - Lobby Server connects all players to the **Execution Server**:
     - passes room/game context and player slot mapping,  
     - arranges for controller inputs to be routed to Execution.  
   - Lobby UI stops showing catalog and can display a “game in progress” or simply switch context.  
   - Lobby Server continues as a **rejoin coordinator** for players who disconnect and return.

5. **Game execution**  
   - Execution Server runs the **game runtime** and maintains game/session state.  
   - Controllers send input → (via Lobby routing if needed) → Execution Server → game/emulator → on-screen updates.

## Step 7 — Architecture (components & boundaries)

### Deployable / runtime units

- **Distribution Service**
  - Long-lived, potentially cloud-hosted.
  - Serves:
    - **Lobby Creator UI** (`/create-lobby` or equivalent),
    - **Controller UI bundle**,
    - **Game Catalog API** (`/games` or similar).
  - Knows about:
    - Available **emulator+ROM packages**,
    - How to instruct a host to start a Lobby Server (for the PoC this can be a manual or local step).

- **Lobby Service (per host / per lobby)**
  - Runs on the **host machine** for a given session.
  - Manages one **room** in the **lobby phase**:
    - Tracks players, slots, and roles (Host vs Guests).
    - Fetches catalog data from Distribution.
    - Provides a **real-time channel** for:
      - controller clients (phones),
      - the Lobby UI on the host browser.
  - On game selection by the Host:
    - starts/binds an **Execution Service** instance,
    - hands over room and player mapping,
    - transitions from “catalog view” to “game in progress” and remains available for routing/rejoin behavior.

- **Execution Service (per host / per game session)**
  - Runs on the **host machine** for a specific game.
  - Owns:
    - the **game runtime** (emulator + ROM + rendering context),
    - a **real-time input API** to accept events for players (P1–P4),
    - in-game player mapping and session state.
  - Can expose minimal status back to the Lobby (e.g., running/ended) for UI and reconnection.

> For the PoC, all three may live in one process, but they remain conceptually separate with clear responsibilities and interfaces.

### Logical modules (code organization)

Regardless of specific tech stack, the implementation is organized into modules such as:

- **`catalog/`**
  - Types: `Game`, `EmulatorPackage`, `GameId`, `RoomId`.
  - Operations: list games, fetch game metadata used by Distribution and Lobby.

- **`rooms/`**
  - Types: `Room`, `Player`, `RoomPhase`, `PlayerRole`.
  - Operations:
    - `createRoom`, `joinRoom`, `assignSlotAndRole`,
    - `markDisconnected`, `rejoinWithToken`,
    - update selected game, transition `phase: "lobby" → "executing"`.

- **`lobby-core/`**
  - Encapsulates lobby-specific behavior:
    - create lobby from a request,
    - integrate with `catalog/`,
    - manage real-time connections for lobby clients,
    - handle game selection, then call into `execution-core/` to start a session.

- **`execution-core/`**
  - Encapsulates game-phase behavior:
    - given `gameId` and players list, start a game runtime,
    - manage applying generic input events to the runtime,
    - manage lifecycle: start, shutdown, notify Lobby of state changes.

- **`realtime/`**
  - Abstracts transport (WebSockets or equivalent):
    - connection types: Lobby UI, Controller, Game Client,
    - message schemas: `JoinLobby`, `LobbyState`, `StartGame`, `InputEvent`, `Rejoin`, etc.
  - Keeps transport concerns separate from business logic.

- **`ui-lobby/` (frontend bundle)**
  - Renders catalog, QR, connected players, “start game” actions.
  - Talks to Distribution for initial assets and to the Lobby Service for real-time lobby state/actions.

- **`ui-controller/` (frontend bundle)**
  - Renders universal controller UI.
  - Talks to Lobby/Execution according to the current phase, using the shared `InputEvent` schema.

- **`game-runtime-adapter/`**
  - Thin adapter around the chosen game/emulator engine (browser or local):
    - API like `loadGame(gameId)`, `applyInput(inputEvent)`, `shutdown()`.
  - Hides emulator-specific details so higher layers only see generic input events.

### Key boundaries

- **Distribution ↔ Lobby**
  - Distribution provides:
    - static assets (UIs),
    - catalog data,
    - lobby creation endpoints or instructions.
  - Lobby relies on catalog APIs and configuration but remains independent of Distribution’s deployment details.

- **Lobby ↔ Execution**
  - Lobby initiates game sessions with “start game” requests containing:
    - `roomId`, `gameId`, and players list.
  - Execution responds with:
    - confirmation, input endpoint configuration, and minimal session status.

- **Controllers ↔ Lobby / Execution**
  - Controllers always speak in a **generic input protocol**: `{ roomId, playerId, slot, control, action, value? }`,
  - Backend decides whether the authoritative endpoint is Lobby (pre-game) or Execution (in-game), without changing controller semantics.

- **Execution ↔ Game runtime**
  - Fully wrapped by `game-runtime-adapter`, allowing emulator/engine swaps without breaking the rest of the system.

## Step 8 — Components & interfaces (message contracts)

### Distribution Service

- **Game Catalog API (HTTP)**
  - `GET /api/games`  
  - Response shape:
    - `games[]` each with: `id`, `name`, `system`, `description`, `assets`, `packageRef`.
  - Used by:
    - Distribution front end (for catalog),
    - Lobby Service (to show options in the Lobby UI).

- **Lobby creation (conceptual)**
  - `POST /api/lobbies`  
  - Request: host info or identifier.  
  - Response: a `lobbyUrl` and `roomId` the host can open on their machine.

### Lobby Service (room + lobby phase)

- **Core types**

  - `RoomPhase = "lobby" | "executing"`  
  - `PlayerRole = "host" | "guest"`

  - `Player`:
    - `id`: server-generated id  
    - `name`: unique per room  
    - `slot`: 1..4  
    - `role`: Host or Guest  
    - `token`: reconnect token  
    - `connected`: boolean

  - `Room`:
    - `id`: room id  
    - `phase`: `RoomPhase`  
    - `selectedGameId`: `string | null`  
    - `players`: `Player[]`

- **Real-time messages (controllers & lobby UI)**

  - **Controller → Lobby: `joinLobby`**

    ```json
    {
      "type": "joinLobby",
      "roomId": "ROOM123",
      "name": "Alice",
      "reconnectToken": "optional-token-or-null"
    }
    ```

  - **Lobby → Controller: `lobbyJoinAck`**

    Successful:

    ```json
    {
      "type": "lobbyJoinAck",
      "roomId": "ROOM123",
      "playerId": "P-uuid",
      "slot": 1,
      "role": "host",
      "token": "new-or-reused-token",
      "error": null
    }
    ```

    Error (e.g., duplicate name):

    ```json
    {
      "type": "lobbyJoinAck",
      "roomId": "ROOM123",
      "error": "Name already taken"
    }
    ```

  - **Lobby → Lobby UI / Controllers: `lobbyState`**

    ```json
    {
      "type": "lobbyState",
      "roomId": "ROOM123",
      "phase": "lobby",
      "players": [
        { "id": "P1", "name": "Alice", "slot": 1, "role": "host", "connected": true },
        { "id": "P2", "name": "Bob",   "slot": 2, "role": "guest", "connected": true }
      ],
      "selectedGameId": null
    }
    ```

  - **Lobby UI → Lobby: `selectGame` (Host only)**

    ```json
    {
      "type": "selectGame",
      "roomId": "ROOM123",
      "playerId": "P1",
      "gameId": "snes-mario-world"
    }
    ```

  - **Lobby → All: `gameStarting`**

    ```json
    {
      "type": "gameStarting",
      "roomId": "ROOM123",
      "gameId": "snes-mario-world"
    }
    ```

### Execution Service (game phase)

- **Input event type**

  - Generic `InputEvent` used by controllers, Lobby routing, and the game runtime adapter:

    ```json
    {
      "type": "input",
      "roomId": "ROOM123",
      "playerId": "P1",
      "slot": 1,
      "control": "A",
      "action": "down",
      "value": null,
      "clientTime": 1730000000000
    }
    ```

  - Fields:
    - `control`: e.g., `"A"`, `"B"`, `"DPadUp"`, `"Start"`, `"L"`, `"R"`, `"AnalogX"`, `"AnalogY"`.  
    - `action`: `"down"`, `"up"`, or `"axis"` for analog updates.  
    - `value`: optional numeric value for axes.  
    - `clientTime`: optional timestamp from the controller for latency analysis.

- **Lobby → Execution: `startGameSession`**

  ```json
  {
    "type": "startGameSession",
    "roomId": "ROOM123",
    "gameId": "snes-mario-world",
    "players": [
      { "id": "P1", "name": "Alice", "slot": 1 },
      { "id": "P2", "name": "Bob",   "slot": 2 }
    ]
  }
  ```

- **Execution → Lobby / UI: `gameState` (optional for PoC)**

  ```json
  {
    "type": "gameState",
    "roomId": "ROOM123",
    "status": "running"
  }
  ```

### Controller Web App interface

- Uses the `joinLobby`, `lobbyJoinAck`, `lobbyState`, `gameStarting`, and `input` messages.  
- Stores a simple identity object locally, e.g.:

  ```json
  {
    "roomId": "ROOM123",
    "token": "reconnect-token",
    "lastKnownPlayerId": "P1"
  }
  ```

### Lobby / Game Client interface

- During lobby:
  - Sends `selectGame` when Host chooses a game.
  - Receives `lobbyState` and `gameStarting`.
- During game:
  - Hosts the `game-runtime-adapter` with APIs like:

    ```text
    loadGame(gameId)
    applyInput(inputEvent)
    shutdown()
    ```

  - Subscribes to `input` events (directly from Execution or via Lobby routing) and passes them into the adapter.


