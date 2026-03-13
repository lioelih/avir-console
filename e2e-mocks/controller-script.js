/**
 * Mock controller script — simulates two players joining and sending input.
 * Adds clientTime to each input for latency logging; optionally notifies load complete (simulated).
 */

async function runControllerScript(baseUrl, lobby, execution = null) {
  const results = { roomId: null, p1: null, p2: null, errors: [] };

  try {
    const res = await fetch(`${baseUrl}/api/lobbies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) throw new Error('Create lobby failed: ' + res.status);
    const { roomId } = await res.json();
    results.roomId = roomId;

    const ack1 = lobby.joinLobby(roomId, 'Alice', null);
    if (ack1.error) throw new Error('P1 join: ' + ack1.error);
    results.p1 = { playerId: ack1.playerId, slot: ack1.slot, role: ack1.role };

    const ack2 = lobby.joinLobby(roomId, 'Bob', null);
    if (ack2.error) throw new Error('P2 join: ' + ack2.error);
    results.p2 = { playerId: ack2.playerId, slot: ack2.slot, role: ack2.role };

    const selectResult = lobby.selectGame(roomId, results.p1.playerId, 'snes-mario-world');
    if (!selectResult.ok) throw new Error('Select game: ' + (selectResult.error || 'failed'));

    // Simulate host load delay: in real app, game page would call notifyLoadComplete when emulator is ready
    if (execution && typeof execution.notifyLoadComplete === 'function') {
      await new Promise((r) => setTimeout(r, 50));
      execution.notifyLoadComplete(roomId);
    }

    function send(roomId, playerId, slot, control, action) {
      const clientTime = Date.now();
      lobby.sendInput(roomId, { type: 'input', roomId, playerId, slot, control, action, value: null, clientTime });
    }

    send(roomId, results.p1.playerId, 1, 'A', 'down');
    send(roomId, results.p1.playerId, 1, 'A', 'up');
    send(roomId, results.p2.playerId, 2, 'DPadUp', 'down');
    send(roomId, results.p2.playerId, 2, 'DPadUp', 'up');
  } catch (err) {
    results.errors.push(err.message);
  }

  return results;
}

module.exports = { runControllerScript };
