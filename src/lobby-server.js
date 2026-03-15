/**
 * Real Lobby server — HTTP + WebSocket. Same message contracts as e2e mocks.
 * Reuses lobby and execution mocks for room/player logic; Execution is a stub (logs only).
 */

const os = require('os');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');
const { WebSocketServer } = require('ws');
const { createExecutionMock } = require('../e2e-mocks/execution-mock');
const { createLobbyMock } = require('../e2e-mocks/lobby-mock');

const PORT = Number(process.env.PORT) || 3001;

const execution = createExecutionMock();
const lobby = createLobbyMock(execution);

// roomId -> Set of WebSocket clients in that room
const roomClients = new Map();

function ensureRoomSet(roomId) {
  if (!roomClients.has(roomId)) roomClients.set(roomId, new Set());
  return roomClients.get(roomId);
}

function buildLobbyState(room) {
  return {
    type: 'lobbyState',
    roomId: room.id,
    phase: room.phase,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      slot: p.slot,
      role: p.role,
      connected: p.connected,
    })),
    selectedGameId: room.selectedGameId,
  };
}

function broadcastToRoom(roomId, message) {
  const set = roomClients.get(roomId);
  if (!set) return;
  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  set.forEach((ws) => {
    if (ws.readyState === 1) ws.send(payload);
  });
}

function send(ws, message) {
  if (ws.readyState === 1) ws.send(JSON.stringify(message));
}

const app = express();
app.use(express.json());

// Serve static assets and pages
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'lobby.html')));
app.get('/controller', (req, res) => res.sendFile(path.join(publicDir, 'controller.html')));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/qr', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url');
  try {
    const buf = await QRCode.toBuffer(url, { type: 'png', width: 200, margin: 1 });
    res.setHeader('Content-Type', 'image/png');
    res.send(buf);
  } catch (e) {
    res.status(500).send('QR failed');
  }
});

function getLanHost() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

app.get('/api/host', (req, res) => {
  const host = getLanHost();
  res.json({ host: host || 'localhost', port: PORT });
});

app.post('/api/rooms', (req, res) => {
  const roomId = lobby.createRoom();
  res.status(201).json({ roomId });
});

app.get('/api/rooms/:roomId/state', (req, res) => {
  const room = lobby.getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    roomId: room.id,
    phase: room.phase,
    players: room.players.map((p) => ({ id: p.id, name: p.name, slot: p.slot, role: p.role, connected: p.connected })),
    selectedGameId: room.selectedGameId,
  });
});

app.post('/api/rooms/:roomId/start', (req, res) => {
  const { roomId } = req.params;
  const { gameId } = req.body || {};
  const room = lobby.getRoom(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.phase !== 'lobby') return res.status(400).json({ error: 'Game already started' });
  const host = room.players.find((p) => p.role === 'host');
  if (!host) return res.status(400).json({ error: 'No host in room yet' });
  const result = lobby.selectGame(roomId, host.id, gameId || 'snes-mario-world');
  if (!result.ok) return res.status(400).json({ error: result.error });
  broadcastToRoom(roomId, { type: 'gameStarting', roomId, gameId: result.gameId });
  res.json({ ok: true, gameId: result.gameId });
});

const server = app.listen(PORT, () => {
  console.log(`Lobby server listening on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.roomId = null;
  ws.playerId = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', error: 'Invalid JSON' });
      return;
    }

    const { type, roomId, name, reconnectToken, playerId, gameId } = msg;

    if (type === 'joinLobby') {
      const ack = lobby.joinLobby(roomId, name, reconnectToken ?? null);
      send(ws, ack);
      if (ack.error) return;
      ws.roomId = roomId;
      ws.playerId = ack.playerId;
      ensureRoomSet(roomId).add(ws);
      const room = lobby.getRoom(roomId);
      if (room) broadcastToRoom(roomId, buildLobbyState(room));
      return;
    }

    if (type === 'selectGame') {
      const result = lobby.selectGame(roomId, playerId, gameId);
      if (!result.ok) {
        send(ws, { type: 'error', error: result.error });
        return;
      }
      broadcastToRoom(roomId, { type: 'gameStarting', roomId, gameId: result.gameId });
      return;
    }

    if (type === 'input') {
      lobby.sendInput(roomId, msg);
      return;
    }
  });

  ws.on('close', () => {
    if (ws.roomId) {
      const set = roomClients.get(ws.roomId);
      if (set) {
        set.delete(ws);
        const room = lobby.getRoom(ws.roomId);
        if (room) broadcastToRoom(ws.roomId, buildLobbyState(room));
      }
    }
  });
});
