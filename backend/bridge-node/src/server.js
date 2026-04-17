// src/server.js
const zmq = require('zeromq');
const { createNodes, edges } = require('./config/gridConfig'); 
const { injectAttack } = require('./engine/attackEngine');
const { evaluateAndDefend } = require('./engine/predictionEngine');
const { physicsTick } = require('./engine/simulationEngine');

const state = {
  isAttackActive: false,
  activeScenario: null,
  targetNodeId: null
};

async function main() {
  const publisher = new zmq.Publisher();
  await publisher.bind('tcp://127.0.0.1:5555');

  let nodes = createNodes(); 
  let currentDecision = { text: 'System Stable. Monitoring packet flow.' };

  const sock = new zmq.Subscriber();
  sock.connect("tcp://127.0.0.1:5556");
  sock.subscribe("");

  console.log("🔵 Prediction Core listening on tcp://127.0.0.1:5556");

  // 1. START THE TICKER FIRST
  // This registers the background loop so it runs every 100ms
  setInterval(() => {
    injectAttack(nodes, state);
    evaluateAndDefend(nodes, currentDecision);
    physicsTick(nodes);

    const payload = {
      nodes: nodes.map(n => ({
        id: String(n.id),
        load: n.current_load,
        capacity: n.max_capacity,
        trust: n.trust_score,
        status: n.status,
        position3D: n.position3D // CRITICAL: Send coordinates to React
      })),
      decision_log: currentDecision.text
    };
    
    publisher.send(JSON.stringify(payload)).catch(() => {});

    process.stdout.write(`\r[LIVE] Attacking: ${state.isAttackActive ? state.activeScenario : 'NONE'} | Log: ${currentDecision.text.substring(0, 40)}...`);
  }, 100);

  // 2. START THE BLOCKING LISTENER LAST
  // Now it's safe to block the main thread waiting for ZMQ messages
  for await (const [msg] of sock) {
    const cmd = msg.toString();
    if (cmd === "STOP") {
      state.isAttackActive = false;
      state.targetNodeId = null;
      state.activeScenario = null;
      
      nodes = createNodes(); 
      edges.forEach(e => e.is_active = true); 
      currentDecision.text = 'System Reset. Restoring normal flow.';
      
    } else if (cmd.startsWith("START_")) {
      const parts = cmd.split("_");
      state.activeScenario = parts[1];
      state.targetNodeId = parseInt(parts[2]);
      state.isAttackActive = true;
    }
  }
}

main().catch(console.error);