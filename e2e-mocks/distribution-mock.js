/**
 * Mock Distribution Service — HTTP API only.
 * Serves a hard-coded game catalog and "create lobby" (creates a room in the Lobby mock).
 */

const express = require('express');

const CATALOG = [
  { id: 'snes-mario-world', name: 'Super Mario World', system: 'SNES', description: 'Classic platformer', assets: {}, packageRef: 'snes-mario-world' },
  { id: 'snes-kirby', name: 'Kirby Super Star', system: 'SNES', description: 'Action game', assets: {}, packageRef: 'snes-kirby' },
];

function createDistributionMock(lobby) {
  const app = express();
  app.use(express.json());

  let server = null;

  app.get('/api/games', (req, res) => {
    res.json({ games: CATALOG });
  });

  app.post('/api/lobbies', (req, res) => {
    const roomId = lobby.createRoom();
    const port = server?.address()?.port ?? 0;
    const lobbyUrl = `http://localhost:${port}/lobby/${roomId}`;
    res.status(201).json({ lobbyUrl, roomId });
  });

  function start(port = 0) {
    return new Promise((resolve) => {
      server = app.listen(port, '127.0.0.1', () => resolve(server));
    });
  }

  function stop() {
    return new Promise((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });
  }

  return { app, start, stop, getServer: () => server };
}

module.exports = { createDistributionMock, CATALOG };
