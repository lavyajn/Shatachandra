// src/server.js — Global Defence State & Tick Integration
const zmq = require('zeromq');
const { createNodes, edges } = require('./config/gridConfig'); 
const { injectAttack } = require('./engine/attackEngine');
const { evaluateAndDefend } = require('./engine/predictionEngine');
const { physicsTick } = require('./engine/simulationEngine');

// Single source of truth for all runtime flags.
// Never pass defence state as a module-level variable inside predictionEngine.js
// — own it here and inject it on every tick call.
const state = {
  isAttackActive: false,
  activeScenario: null,
  targetNodeId: null,
  isDefenseActive: true,  // Default: defence ON at startup
  tickCount: 0,
};

// Track connected WebSocket clients for DEFENSE_STATE broadcast
let wssClients = new Set();

// Called by the command listener when DEFENSE_OFF / DEFENSE_ON received.
// Broadcasts confirmation to all connected frontends.
function setDefenseState(active) {
  state.isDefenseActive = active;
  console.log(`[SERVER] Defence engine: ${active ? 'ACTIVE' : 'BYPASSED'}`);
  // Broadcast defence state confirmation to all connected React frontends
  broadcastDefenseState(active);
}

function broadcastDefenseState(active) {
  const msg = JSON.stringify({ type: 'DEFENSE_STATE', active });
  // wssClients is populated by the telemetry broadcast path
  // We piggyback on the publisher for now — the frontend parses this as a special message
}

async function main() {
  // Setup ZMQ Publisher (Telemetry Out)
  const publisher = new zmq.Publisher();
  await publisher.bind('tcp://127.0.0.1:5555');

  // Setup ZMQ Subscriber (Commands In)
  const sock = new zmq.Subscriber();
  sock.connect("tcp://127.0.0.1:5556");
  sock.subscribe("");

  let nodes = createNodes(); 
  let currentDecision = { text: 'System Stable. Monitoring packet flow.' };

  console.log("[SERVER] Sanrakshan Prediction Core: ONLINE");
  console.log("[SERVER] Listening for Commands on tcp://127.0.0.1:5556");

  // THE TICKER (100ms physics + AI tick loop)
  setInterval(() => {
    state.tickCount++;

    // 1. Inject attack traffic (always runs)
    injectAttack(nodes, state);

    // 2. Physics tick — always runs, handles load dynamics + bleed logic
    physicsTick(nodes, edges);

    // FIREWALL LOGIC: Only invoke AI if defence is armed.
    // When isDefenseActive is false, the prediction engine is
    // completely skipped — no interceptions, no decisions.
    if (state.isDefenseActive) {
      evaluateAndDefend(nodes, edges, currentDecision, state);
    }

    // Broadcast Telemetry to the Bridge (includes defense_active flag)
    const payload = {
      nodes: nodes.map(n => ({
        id: String(n.id),
        load: n.current_load,
        capacity: n.max_capacity,
        trust: n.trust_score,
        status: n.status,
        position3D: n.position3D 
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        is_active: e.is_active,
      })),
      decision_log: currentDecision.text,
      defense_active: state.isDefenseActive,
    };
    
    publisher.send(JSON.stringify(payload)).catch(() => {});

    // CLI Status Monitor
    const mode = state.isDefenseActive ? "PROTECTED" : "UNPROTECTED";
    process.stdout.write(`\r[${mode}] Tick:${state.tickCount} Attacking: ${state.isAttackActive ? state.activeScenario : 'NONE'} | Node: ${state.targetNodeId ?? 'N/A'}   `);
  }, 100);

  // THE COMMAND LISTENER (Blocking Loop)
  for await (const [msg] of sock) {
    const cmd = msg.toString().toUpperCase();
    console.log(`\n[SERVER] Command received: "${cmd}"`);

    // Defense Toggles
    if (cmd.includes("DEFENSE_OFF")) {
      setDefenseState(false);
    } 
    else if (cmd.includes("DEFENSE_ON")) {
      setDefenseState(true);
    } 
    
    // System Control — STOP
    else if (cmd === "STOP") {
      state.isAttackActive = false;
      state.targetNodeId = null;
      state.activeScenario = null;
      
      // Hard Reset: Rebuild nodes and restore edges
      nodes = createNodes(); 
      edges.forEach(e => e.is_active = true); 
      currentDecision.text = 'System Reset. Restoring normal flow.';
      console.log("[SERVER] System: Hard Reset Performed.");
    } 
    
    // Attack Initiation
    else if (cmd.startsWith("START_")) {
      const parts = cmd.split("_");
      state.activeScenario = parts[1];
      state.targetNodeId = parseInt(parts[2]);
      state.isAttackActive = true;
      console.log(`[SERVER] Attack Initiated: ${state.activeScenario} on Node ${state.targetNodeId}`);
    }
  }
}

main().catch(console.error);