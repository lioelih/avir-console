/**
 * Single "mock e2e run" — starts Distribution (HTTP), Lobby + Execution (in-process),
 * runs the controller script, then asserts on Execution logs.
 */

const { createExecutionMock } = require('./execution-mock');
const { createLobbyMock } = require('./lobby-mock');
const { createDistributionMock } = require('./distribution-mock');
const { runControllerScript } = require('./controller-script');

async function main() {
  const execution = createExecutionMock();
  const lobby = createLobbyMock(execution);
  const distribution = createDistributionMock(lobby);

  const port = 0;
  await distribution.start(port);
  const actualPort = distribution.getServer().address().port;
  const baseUrl = `http://127.0.0.1:${actualPort}`;

  console.log('--- Mock E2E run ---');
  const scriptResult = await runControllerScript(baseUrl, lobby, execution);
  await distribution.stop();

  if (scriptResult.errors.length > 0) {
    console.error('Script errors:', scriptResult.errors);
    process.exit(1);
  }

  const logs = execution.getLogs();
  const hasStart = logs.some((e) => e.type === 'startGameSession' && e.playerCount === 2);
  const hasP1Input = logs.some((e) => e.type === 'input' && e.slot === 1 && e.control === 'A');
  const hasP2Input = logs.some((e) => e.type === 'input' && e.slot === 2 && e.control === 'DPadUp');

  if (!hasStart || !hasP1Input || !hasP2Input) {
    console.error('Assertions failed. Logs:', logs);
    process.exit(1);
  }

  console.log('--- E2E passed: lobby created, P1/P2 joined, game selected, input received ---');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
