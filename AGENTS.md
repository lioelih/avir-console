# Agent context for this project

When helping in this repo, read these first so you have full project context:

1. **Design, goals, and contracts**  
   - `.cursor/notes/dev-flow-steps-1-2.md` — Dev Flow steps 1–9 (problem, goal, constraints, personas, stories, solution framing, architecture, interfaces, tech stack) and current state of the product.

2. **Current work**  
   - `.cursor/contracts/` — Active contracts (e.g. `e2e-mocks-poc.md` for the E2E mocks contract). Check the contract status and tasks when implementing or planning.

3. **Rules and meta**  
   - `.cursor/meta.mdc` — FSC structure, disciplines (BDD/TDD), work contracts, security.  
   - `.cursor/guide/dev-flow.mdc` — 10-step dev flow (no code until step 10).  
   - `.cursor/rules/test-matrix.mdc` — Test layers and ROGBY cycle.

This is a **local party game platform**: host opens a lobby, players join via QR with phones as controllers, game runs in the browser (SNES emulator). Backend roles: Distribution, Lobby, Execution. Stack: TypeScript/Node for PoC.
