/**
 * Mock Execution Service — receives game session start and input events, logs them.
 * Logs timestamps for latency visibility and a "load complete" hook for host load-time measurement.
 */

function createExecutionMock() {
  const logs = [];
  const loadCompleteTimes = {}; // roomId -> timestamp

  function startGameSession(data) {
    const now = Date.now();
    const entry = { type: 'startGameSession', roomId: data.roomId, gameId: data.gameId, playerCount: (data.players || []).length, at: now };
    logs.push(entry);
    console.log('[Execution] startGameSession', data.roomId, data.gameId, 'players:', (data.players || []).length, 'at T=' + now, '(host should start loading game+emulator here)');
  }

  function input(data) {
    const now = Date.now();
    const clientTime = data.clientTime != null ? Number(data.clientTime) : null;
    const deltaMs = clientTime != null ? (now - clientTime) : null;
    const entry = { type: 'input', roomId: data.roomId, playerId: data.playerId, slot: data.slot, control: data.control, action: data.action, clientTime, executionReceivedAt: now, deltaMs };
    logs.push(entry);
    const deltaStr = deltaMs != null ? ` delta=${deltaMs}ms` : '';
    console.log('[Execution] input', `slot=${data.slot}`, data.control, data.action, 'at T=' + now + deltaStr);
  }

  function notifyLoadComplete(roomId) {
    const now = Date.now();
    loadCompleteTimes[roomId] = now;
    console.log('[Execution] loadComplete', roomId, 'at T=' + now, '(real game page will log this when emulator is ready)');
  }

  function getLoadCompleteTime(roomId) {
    return loadCompleteTimes[roomId] ?? null;
  }

  function getLogs() {
    return [...logs];
  }

  function clearLogs() {
    logs.length = 0;
    Object.keys(loadCompleteTimes).forEach((k) => delete loadCompleteTimes[k]);
  }

  return { startGameSession, input, notifyLoadComplete, getLoadCompleteTime, getLogs, clearLogs };
}

module.exports = { createExecutionMock };
