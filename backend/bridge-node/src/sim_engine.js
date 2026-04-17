const zmq = require('zeromq');

// ============ CONFIGURATION & CONSTANTS ============
const NodeStatus = { NORMAL: 0, WARNING: 1, COMPROMISED: 2, ISOLATED: 3 };
const TRUST_DECAY = 5.0;
const CRITICAL_TRUST = 30.0;
const DDOS_THRESHOLD = 500;

let isAttackActive = false;
let activeScenario = null;
let targetNodeId = null;

// ============ INITIALIZATION ============
function createNodes() {
  return [
    { id: 0, current_load: 20.0, max_capacity: 100.0, trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL },
    { id: 1, current_load: 30.0, max_capacity: 80.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL },
    { id: 2, current_load: 40.0, max_capacity: 90.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL },
    { id: 3, current_load: 15.0, max_capacity: 50.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL },
    { id: 4, current_load: 35.0, max_capacity: 85.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL },
  ];
}

const edges = [
  { id: 0, source: 0, target: 1, is_active: true },
  { id: 1, source: 1, target: 2, is_active: true },
  { id: 2, source: 2, target: 3, is_active: true },
  { id: 3, source: 1, target: 4, is_active: true },
];

// ============ ENGINE LOGIC ============

function evaluateAndDefend(nodes, currentDecision) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    // Detect DDoS based on packet volume
    if (node.incoming_packets > DDOS_THRESHOLD) {
      node.trust_score -= TRUST_DECAY;
      node.status = NodeStatus.WARNING;
    } else if (node.trust_score < 100.0) {
      node.trust_score += 0.5; // Natural recovery
      if (node.trust_score > 80.0 && node.status === NodeStatus.WARNING) {
        node.status = NodeStatus.NORMAL;
      }
    }

    // Trigger Smart Defense if trust collapses
    if (node.trust_score <= CRITICAL_TRUST && node.status !== NodeStatus.COMPROMISED) {
      node.status = NodeStatus.COMPROMISED;
      currentDecision.text = executeSmartDefense(nodes, node);
    }
  }
}

function executeSmartDefense(nodes, threatNode) {
  // Simple check: would isolating this node cause neighbors to exceed capacity?
  const neighbors = edges
    .filter(e => e.target === threatNode.id && e.is_active)
    .map(e => nodes.find(n => n.id === e.source));

  const cascadeRisk = neighbors.some(n => (n.current_load + (threatNode.current_load / neighbors.length)) > n.max_capacity);

  if (cascadeRisk) {
    threatNode.incoming_packets *= 0.2; // Rate Limiting
    return `[PREDICTION] Isolation risk high. Applying Rate Limiting to Node ${threatNode.id}`;
  } else {
    threatNode.status = NodeStatus.ISOLATED;
    threatNode.current_load = 0;
    return `[PREDICTION] Isolation safe. Node ${threatNode.id} isolated.`;
  }
}

function physicsTick(nodes) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    // P -> L conversion (Physics)
    node.current_load += node.incoming_packets * 0.05;
    node.incoming_packets = 0; // Reset for next tick

    // Check for physical failure
    if (node.current_load > node.max_capacity) {
      node.status = NodeStatus.ISOLATED;
      redistributeLoad(nodes, node);
    }
  }
}

function redistributeLoad(nodes, failedNode) {
  const activeEdges = edges.filter(e => e.target === failedNode.id && e.is_active);
  if (activeEdges.length === 0) return;

  const splitLoad = failedNode.current_load / activeEdges.length;
  activeEdges.forEach(edge => {
    edge.is_active = false;
    const neighbor = nodes.find(n => n.id === edge.source);
    if (neighbor) neighbor.current_load += splitLoad;
  });
  failedNode.current_load = 0;
}

// ============ ZMQ & MAIN LOOP ============

async function startCommandListener() {
  const sock = new zmq.Subscriber();
  sock.connect("tcp://127.0.0.1:5556");
  sock.subscribe("");
  console.log("🔵 Sim Engine listening for commands on tcp://127.0.0.1:5556");

  for await (const [msg] of sock) {
    const cmd = msg.toString();
    console.log(`\n[CMD] ${cmd}`);
    if (cmd === "STOP") {
      isAttackActive = false;
      targetNodeId = null;
    } else if (cmd.startsWith("START_")) {
      const parts = cmd.split("_"); // START_DDOS_2
      activeScenario = parts[1];
      targetNodeId = parseInt(parts[2]);
      isAttackActive = true;
    }
  }
}

async function main() {
  const publisher = new zmq.Publisher();
  await publisher.bind('tcp://127.0.0.1:5555');

  const nodes = createNodes();
  let currentDecision = { text: 'System Stable. Monitoring packet flow.' };

  startCommandListener();

  setInterval(() => {
    // 1. Baseline Traffic (Always on)
    nodes.forEach(n => { if (n.status !== NodeStatus.ISOLATED) n.incoming_packets += 5; });

    // 2. Attack Injection
    if (isAttackActive && targetNodeId !== null) {
      const target = nodes.find(n => n.id === targetNodeId);
      if (target) {
        if (activeScenario === 'DDOS') target.incoming_packets += 800;
        else if (activeScenario === 'SPOOFING') target.trust_score -= 2.5;
        else if (activeScenario === 'FDI') target.current_load += 12.0;
      }
    }

    // 3. Run Pipeline
    evaluateAndDefend(nodes, currentDecision);
    physicsTick(nodes);

    // 4. Broadcast
    const payload = {
      nodes: nodes.map(n => ({ id: String(n.id), load: n.current_load, capacity: n.max_capacity, trust: n.trust_score, status: n.status })),
      decision_log: currentDecision.text
    };
    publisher.send(JSON.stringify(payload)).catch(() => {});

    // Terminal Readout
    process.stdout.write(`\r[LIVE] Attacking: ${isAttackActive ? activeScenario : 'NONE'} | Log: ${currentDecision.text.substring(0, 40)}...`);
  }, 100);
}

main().catch(console.error);