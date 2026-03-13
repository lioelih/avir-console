/**
 * Mock Lobby Service — in-memory rooms and players.
 * Handles joinLobby, selectGame, and forwards input to Execution when phase is "executing".
 */

function generateId(prefix = 'P') {
  return prefix + '-' + Math.random().toString(36).slice(2, 10);
}

function createLobbyMock(execution) {
  const rooms = new Map();

  function createRoom() {
    const roomId = 'ROOM-' + Math.random().toString(36).slice(2, 8);
    rooms.set(roomId, {
      id: roomId,
      phase: 'lobby',
      selectedGameId: null,
      players: [],
    });
    return roomId;
  }

  function joinLobby(roomId, name, reconnectToken = null) {
    const room = rooms.get(roomId);
    if (!room) return { type: 'lobbyJoinAck', error: 'Room not found' };

    const safeName = (name && String(name).trim()) || 'Unknown';
    const existing = room.players.find((p) => p.name === safeName);
    if (existing) {
      if (reconnectToken && existing.token === reconnectToken) {
        existing.connected = true;
        return {
          type: 'lobbyJoinAck',
          roomId,
          playerId: existing.id,
          slot: existing.slot,
          role: existing.role,
          token: existing.token,
          error: null,
        };
      }
      return { type: 'lobbyJoinAck', roomId, error: 'Name already taken' };
    }

    if (room.players.length >= 4) return { type: 'lobbyJoinAck', roomId, error: 'Room full' };

    const slot = room.players.length + 1;
    const role = slot === 1 ? 'host' : 'guest';
    const player = {
      id: generateId(),
      name: safeName,
      slot,
      role,
      token: reconnectToken || generateId('T'),
      connected: true,
    };
    room.players.push(player);

    return {
      type: 'lobbyJoinAck',
      roomId,
      playerId: player.id,
      slot: player.slot,
      role: player.role,
      token: player.token,
      error: null,
    };
  }

  function selectGame(roomId, playerId, gameId) {
    const room = rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.phase !== 'lobby') return { ok: false, error: 'Game already started' };

    const host = room.players.find((p) => p.id === playerId);
    if (!host || host.role !== 'host') return { ok: false, error: 'Only host can select game' };

    room.phase = 'executing';
    room.selectedGameId = gameId;

    execution.startGameSession({
      type: 'startGameSession',
      roomId,
      gameId,
      players: room.players.map((p) => ({ id: p.id, name: p.name, slot: p.slot })),
    });

    return { ok: true, type: 'gameStarting', roomId, gameId };
  }

  function sendInput(roomId, inputEvent) {
    const room = rooms.get(roomId);
    if (!room) return { ok: false };
    if (room.phase !== 'executing') return { ok: false };
    const lobbyReceivedAt = Date.now();
    console.log('[Lobby] input received at T=' + lobbyReceivedAt, 'slot=' + (inputEvent.slot), inputEvent.control, inputEvent.action);
    execution.input(inputEvent);
    console.log('[Lobby] forwarded to Execution');
    return { ok: true };
  }

  function getRoom(roomId) {
    return rooms.get(roomId);
  }

  return { createRoom, joinLobby, selectGame, sendInput, getRoom, _rooms: rooms };
}

module.exports = { createLobbyMock };
