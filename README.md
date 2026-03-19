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

Port can be overridden with `PORT=3002 npm run start:lobby`.

### Join URL / QR code (phones on the same network)

The lobby builds links like `http://<your-LAN-IP>:3001/controller?room=...`.

- **Your “correct” IP** is usually the one on your **real** network adapter (e.g. **Ethernet** or **Wi‑Fi**), often `10.x.x.x` or `192.168.x.x` — **not** `127.0.0.1` and **not** the **vEthernet (WSL)** address (`172.x.x.x` on Windows).
- **Automatic detection:** Under **WSL2**, the server asks **Windows** for the IPv4 on the NIC used for the **default IPv4 route** (`0.0.0.0/0`) — the same idea as which adapter `ipconfig` shows for your real LAN (e.g. **10.100.102.13** on Ethernet). That avoids picking a **192.168.x.x** address from another virtual adapter (Hyper-V, hotspot, etc.) that used to win on interface metric alone.
- **Override:** If the wrong address is shown, set once per machine/session:
  ```bash
  export AVIR_PUBLIC_HOST=10.100.102.13
  npm run start:lobby
  ```
  On Windows CMD: `set AVIR_PUBLIC_HOST=10.100.102.13` then run `npm run start:lobby`.

**Will my IP change?** On most home networks the router assigns addresses with **DHCP**, so the IP **can** change after a reboot or lease renewal. If it does, detection should pick up the new one; you can still use `AVIR_PUBLIC_HOST` or a DHCP “static lease” on your router for a fixed IP.

#### Phone can’t open the link (PC browser works)

1. **Same network** — Phone and PC must be on the **same Wi‑Fi** (not **Guest** / **IoT** Wi‑Fi if those are isolated from the PC). Turn off **mobile data** temporarily so the phone doesn’t route the request oddly.
2. **Use `http://` not `https://`** — The lobby uses plain HTTP. If the phone “upgrades” to HTTPS, it will fail.
3. **Check the IP** — On Windows, run `ipconfig` and find **Wireless LAN adapter Wi‑Fi** (or Ethernet) **IPv4 Address**. It must match the host in the join URL (e.g. `http://192.168.1.42:3001/...`). If it doesn’t, set `AVIR_PUBLIC_HOST` to that IPv4 and restart `npm run start:lobby`.
4. **Smoke test from the phone** — Open `http://<that-IPv4>:3001/health` in the phone browser. You should see `{"ok":true}`. If that fails, the phone still can’t reach Windows on port 3001 (firewall, wrong IP, or Wi‑Fi isolation).
5. **WSL2** — Re-run `wsl-setup-port-forward.ps1` **as Administrator** after each WSL restart. If the script prints a **yellow firewall WARNING**, fix it (run as Admin or add a Windows Firewall **inbound** rule: TCP **3001**, allow).
6. **Windows network profile** — If the PC’s Wi‑Fi is set to **Public**, some setups block more traffic. Try **Settings → Network → Wi‑Fi → your network → Private** (wording varies by Windows version).
7. **Router “AP isolation” / “client isolation”** — Some routers block phone-to-PC traffic; disable it for your LAN/Wi‑Fi if you use it.

**WSL2:** The server runs inside Linux; phones use your Windows LAN IP. Windows must **forward** port `3001` to WSL. You have two options so you don’t have to remember manual commands:

1. **Run the server on Windows (no port forward)**  
   Install Node on Windows, open the project in PowerShell (same repo or clone), run `npm install` and `npm run start:lobby`. Then `10.100.102.13:3001` (or your PC’s IP) works from phones with no extra setup.

2. **Keep using WSL — one script per WSL session**  
   Run this **once** after you start WSL (or after a reboot), then start the server in WSL as usual.  
   - Open **PowerShell as Administrator** (or **CMD as Administrator**) on Windows.  
   - Run this **once** (Ubuntu, user `khturk2`; change distro/username if different). It uses **`-ExecutionPolicy Bypass`** so it works even when “running scripts is disabled” on the machine:
     ```powershell
     powershell -ExecutionPolicy Bypass -File "\\wsl$\Ubuntu\home\khturk2\avir-console\scripts\wsl-setup-port-forward.ps1"
     ```
     Same line works in **PowerShell** and **CMD**.  
     *Optional:* If your execution policy already allows local scripts, you can run from PowerShell only: `& "\\wsl$\Ubuntu\home\khturk2\avir-console\scripts\wsl-setup-port-forward.ps1"`.  
     *Troubleshooting:* If you saw **“The system cannot find the file specified”** but then the green **Port forward: …** line, that was **harmless** (old `netsh` cleanup when no rule existed yet). The script is updated to hide that; pull the latest or ignore if the green line appears.
   - Then in WSL: `npm run start:lobby`.  
   You only need to run the script again if you restart WSL (WSL’s IP can change). No need to run it every time you start the server.

**Fully automatic (optional):** You can run the same script at Windows login (e.g. Task Scheduler) so the forward is always there when WSL is used. Create a task that runs `powershell.exe -ExecutionPolicy Bypass -File "\\wsl$\Ubuntu\home\khturk2\avir-console\scripts\wsl-setup-port-forward.ps1"` at logon (run with highest privileges if needed for netsh).

### Steps from Windows boot to host + phone (WSL)

Use this order every time. Your PC’s **LAN IP** for phones is the **Ethernet** (or Wi‑Fi) **IPv4** from `ipconfig` — e.g. **10.100.102.13**. **Ignore** “vEthernet (WSL)” (172.x); that’s only for WSL↔Windows, not for phones.

| Step | Where | What to do |
|------|--------|------------|
| 1 | Windows | Boot and log in. |
| 2 | Windows | **(Once per WSL session)** Open **PowerShell** or **CMD as Administrator**. Run: |
|   |   | `powershell -ExecutionPolicy Bypass -File "\\wsl$\Ubuntu\home\khturk2\avir-console\scripts\wsl-setup-port-forward.ps1"` |
|   |   | Wait for the green “Port forward: …” line. Close the window or leave it. |
| 3 | WSL | Open **Ubuntu** (or your WSL distro) from the Start menu. |
| 4 | WSL | Start the server: `cd ~/avir-console` then `npm run start:lobby`. Leave this terminal open. |
| 5 | PC browser | Open **http://localhost:3001**. You should see the lobby. |
| 6 | PC browser | Click **Create room**. The page will show a **join URL** and a **QR code**. |
| 7 | Phone | Connect the phone to the **same network** as the PC (same Wi‑Fi / same Ethernet LAN). Turn off mobile data if needed. |
| 8 | Phone | Open the **join URL** in the phone’s browser (e.g. `http://10.100.102.13:3001/controller?room=...`), or **scan the QR code**. Use **http://** — not https. |
| 9 | Phone | Enter a name and join. You should see the controller. The host can start the game from the lobby. |

**Quick check:** On the phone, open `http://10.100.102.13:3001/health` (use your real LAN IP from `ipconfig`). If you see `{"ok":true}`, the phone can reach the server; if not, fix firewall / network / port-forward first.

### Stopping the server (free the port for a second start)

- **If the server is in the foreground** in a terminal: press **Ctrl+C** in that terminal. The process exits and port 3001 is free.
- **If you closed the terminal or the server is in the background:** find and kill the process:
  ```bash
  # Find process using port 3001
  lsof -i :3001
  # Or: ss -tlnp | grep 3001
  # Then kill it (use the PID from the second column of lsof):
  kill <PID>
  ```
  Or in one go:
  ```bash
  pkill -f "node src/lobby-server.js"
  ```
  After that, `npm run start:lobby` can bind to port 3001 again.

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
