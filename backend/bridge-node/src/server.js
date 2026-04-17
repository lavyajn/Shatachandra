// src/server.js
const zmq = require('zeromq');
const { createNodes, edges } = require('./config/gridConfig'); 
const { injectAttack } = require('./engine/attackEngine');
const { evaluateAndDefend } = require('./engine/predictionEngine');
const { physicsTick } = require('./engine/simulationEngine');

// 1. Centralized Engine State
const state = {
  isAttackActive: false,
  activeScenario: null,
  targetNodeId: null,
  isDefenseActive: true // The toggle for "Chaos Mode"
};

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

  console.log("🔵 Sanrakshan Prediction Core: ONLINE");
  console.log("📡 Listening for Commands on tcp://127.0.0.1:5556");

  // 2. THE TICKER (Background Physics & Logic Loop)
  setInterval(() => {
    // Pipeline Execution
    injectAttack(nodes, state);
    
    // Pass the defense flag to determine if isolation should occur
    evaluateAndDefend(nodes, currentDecision, state.isDefenseActive); 
    
    physicsTick(nodes);

    // Broadcast Telemetry to the Bridge
    const payload = {
      nodes: nodes.map(n => ({
        id: String(n.id),
        load: n.current_load,
        capacity: n.max_capacity,
        trust: n.trust_score,
        status: n.status,
        position3D: n.position3D 
      })),
      decision_log: currentDecision.text
    };
    
    publisher.send(JSON.stringify(payload)).catch(() => {});

    // CLI Status Monitor
    const mode = state.isDefenseActive ? "PROTECTED" : "UNPROTECTED";
    process.stdout.write(`\r[${mode}] Attacking: ${state.isAttackActive ? state.activeScenario : 'NONE'} | Node: ${state.targetNodeId ?? 'N/A'}`);
  }, 100);

  // 3. THE COMMAND LISTENER (Blocking Loop)
  for await (const [msg] of sock) {
    const cmd = msg.toString().toUpperCase();

    // Defense Toggles
    if (cmd === "DEFENSE_OFF") {
      state.isDefenseActive = false;
      console.log("\n⚠️ ALERT: AI Defense Engine Disabled by User.");
    } 
    else if (cmd === "DEFENSE_ON") {
      state.isDefenseActive = true;
      console.log("\n🛡️ INFO: AI Defense Engine Re-enabled.");
    } 
    
    // System Control
    else if (cmd === "STOP") {
      state.isAttackActive = false;
      state.targetNodeId = null;
      state.activeScenario = null;
      
      // Hard Reset: Rebuild nodes and restore edges
      nodes = createNodes(); 
      edges.forEach(e => e.is_active = true); 
      currentDecision.text = 'System Reset. Restoring normal flow.';
      console.log("\n🔄 System: Hard Reset Performed.");
    } 
    
    // Attack Initiation
    else if (cmd.startsWith("START_")) {
      const parts = cmd.split("_");
      state.activeScenario = parts[1];
      state.targetNodeId = parseInt(parts[2]);
      state.isAttackActive = true;
      console.log(`\n⚔️ Attack Initiated: ${state.activeScenario} on Node ${state.targetNodeId}`);
    }
  }
}

main().catch(console.error);