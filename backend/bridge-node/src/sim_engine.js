// sim_engine.js — Node.js simulation that mimics the C++ engine
// Publishes the same ZMQ telemetry format as the C++ engine
// Run this instead of the C++ binary for development/demo

const zmq = require('zeromq');

// ============ NODE DEFINITIONS ============
const NodeStatus = { NORMAL: 0, WARNING: 1, COMPROMISED: 2, ISOLATED: 3 };

function createNodes() {
  return [
    { id: 0, current_load: 20.0, max_capacity: 100.0, trust_score: 100.0, incoming_packets: 0, anomaly_strikes: 0, status: NodeStatus.NORMAL },
    { id: 1, current_load: 30.0, max_capacity: 80.0,  trust_score: 100.0, incoming_packets: 0, anomaly_strikes: 0, status: NodeStatus.NORMAL },
    { id: 2, current_load: 40.0, max_capacity: 90.0,  trust_score: 100.0, incoming_packets: 0, anomaly_strikes: 0, status: NodeStatus.NORMAL },
    { id: 3, current_load: 15.0, max_capacity: 50.0,  trust_score: 100.0, incoming_packets: 0, anomaly_strikes: 0, status: NodeStatus.NORMAL },
    { id: 4, current_load: 35.0, max_capacity: 85.0,  trust_score: 100.0, incoming_packets: 0, anomaly_strikes: 0, status: NodeStatus.NORMAL },
  ];
}

const edges = [
  { id: 0, source: 0, target: 1, current_flow: 10.0, max_flow: 50.0, is_active: true },
  { id: 1, source: 1, target: 2, current_flow: 20.0, max_flow: 60.0, is_active: true },
  { id: 2, source: 2, target: 3, current_flow: 10.0, max_flow: 30.0, is_active: true },
  { id: 3, source: 1, target: 4, current_flow: 15.0, max_flow: 40.0, is_active: true },
];

// ============ CONSTANTS ============
const TRUST_DECAY = 5.0;
const CRITICAL_TRUST = 30.0;
const DDOS_THRESHOLD = 500;

// ============ PHYSICS ENGINE ============
function physicsTick(nodes) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    const trafficLoad = node.incoming_packets * 0.05;
    node.current_load += trafficLoad;
    node.incoming_packets = 0;
  }

  // Check overload → cascade
  for (const node of nodes) {
    if (node.status !== NodeStatus.ISOLATED && node.current_load > node.max_capacity) {
      node.status = NodeStatus.ISOLATED;
      redistributeLoad(nodes, node);
    }
  }
}

function redistributeLoad(nodes, failedNode) {
  const activeNeighbors = [];
  for (const edge of edges) {
    if (!edge.is_active) continue;
    if (edge.target === failedNode.id) {
      activeNeighbors.push(edge.source);
      edge.is_active = false;
    }
  }

  if (activeNeighbors.length === 0) return;
  const distributed = failedNode.current_load / activeNeighbors.length;

  for (const nid of activeNeighbors) {
    const neighbor = nodes.find(n => n.id === nid);
    if (neighbor && neighbor.status !== NodeStatus.ISOLATED) {
      neighbor.current_load += distributed;
    }
  }
  failedNode.current_load = 0;
}

// ============ DEFENSE ENGINE ============
function evaluateAndDefend(nodes, decision) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    if (node.incoming_packets > DDOS_THRESHOLD) {
      node.trust_score -= TRUST_DECAY;
      node.status = NodeStatus.WARNING;
      node.anomaly_strikes++;
    } else if (node.trust_score < 100.0) {
      node.trust_score += 0.5;
      if (node.trust_score > 80.0 && node.status === NodeStatus.WARNING) {
        node.status = NodeStatus.NORMAL;
      }
    }

    if (node.trust_score <= CRITICAL_TRUST && node.status !== NodeStatus.COMPROMISED) {
      node.status = NodeStatus.COMPROMISED;
      decision.text = executeSmartDefense(nodes, node);
    }
  }
}

function executeSmartDefense(nodes, threatNode) {
  console.log(`[DEFENSE] Threat detected at Node ${threatNode.id}. Running predictions...`);

  // Simulate shadow graph: check if isolating would cascade
  const neighborNodes = [];
  for (const edge of edges) {
    if (edge.target === threatNode.id && edge.is_active) {
      const neighbor = nodes.find(n => n.id === edge.source);
      if (neighbor && neighbor.status !== NodeStatus.ISOLATED) {
        neighborNodes.push(neighbor);
      }
    }
  }

  const cascadePredicted = neighborNodes.some(n =>
    (n.current_load + threatNode.current_load / Math.max(neighborNodes.length, 1)) > n.max_capacity
  );

  if (cascadePredicted) {
    const log = `[PREDICTION] Isolation will cause CASCADING FAILURE. Rejecting Action. [ACTION] Applying Rate Limiting to Node ${threatNode.id}`;
    console.log(log);
    threatNode.incoming_packets = Math.floor(threatNode.incoming_packets * 0.2);
    return log;
  } else {
    const log = `[PREDICTION] Isolation safe. No cascade detected. [ACTION] Isolating Node ${threatNode.id}`;
    console.log(log);
    threatNode.status = NodeStatus.ISOLATED;
    threatNode.current_load = 0;
    return log;
  }
}

// ============ MAIN LOOP ============
async function main() {
  console.log('========================================');
  console.log(' SHATACHANDRA PREDICTIVE ENGINE (Node.js)');
  console.log('========================================');

  const publisher = new zmq.Publisher();
  await publisher.bind('tcp://127.0.0.1:5555');
  console.log('[ZMQ] Telemetry Firehose active on tcp://127.0.0.1:5555');

  const nodes = createNodes();
  let tickCounter = 0;
  let currentDecision = { text: 'System Stable. Monitoring packet flow.' };

  setInterval(() => {
    tickCounter++;

    // Normal traffic
    for (const node of nodes) {
      if (node.status !== NodeStatus.ISOLATED) {
        node.incoming_packets += 5;
        // Small random load fluctuation
        node.current_load += (Math.random() - 0.5) * 2;
        node.current_load = Math.max(0, Math.min(node.current_load, node.max_capacity * 1.2));
      }
    }

    // === SCRIPTED ATTACK TIMELINE ===
    // Tick 100-120: Massive anomaly at Node 2 (City Hub)
    if (tickCounter > 100 && tickCounter < 120) {
      if (tickCounter === 101) {
        console.log('\n[EVENT] INJECTING MASSIVE ANOMALY AT NODE 2...');
        currentDecision.text = 'CRITICAL: Malicious spike detected at Node 2!';
      }
      nodes[2].incoming_packets += 800;
    }

    // Tick 200-220: Second wave at Node 4 (Industrial Hub)
    if (tickCounter > 200 && tickCounter < 220) {
      if (tickCounter === 201) {
        console.log('\n[EVENT] SECOND WAVE: ANOMALY AT NODE 4...');
        currentDecision.text = 'WARNING: Secondary attack vector detected at Node 4!';
      }
      nodes[4].incoming_packets += 600;
    }

    // Tick 350+: Reset and stabilize
    if (tickCounter === 350) {
      console.log('\n[EVENT] System stabilizing...');
      currentDecision.text = 'System Stable. Monitoring packet flow.';
      // Reset all nodes
      for (const node of nodes) {
        if (node.status === NodeStatus.ISOLATED) {
          node.status = NodeStatus.NORMAL;
          node.current_load = 20;
        }
        node.trust_score = Math.min(100, node.trust_score + 20);
        node.anomaly_strikes = 0;
      }
      // Reset edges
      for (const edge of edges) {
        edge.is_active = true;
      }
    }

    // Loop the timeline
    if (tickCounter > 400) {
      tickCounter = 0;
    }

    // Run engines
    evaluateAndDefend(nodes, currentDecision);
    physicsTick(nodes);

    // Build payload (matching C++ engine format exactly)
    const payload = {
      nodes: nodes.map(n => ({
        id: String(n.id),
        load: n.current_load,
        capacity: n.max_capacity,
        trust: n.trust_score,
        status: n.status,
      })),
      decision_log: currentDecision.text,
    };

    // Publish over ZMQ
    publisher.send(JSON.stringify(payload)).catch(() => {});

    // Terminal readout
    process.stdout.write(`\r[TICK ${tickCounter.toString().padStart(4)}] ` +
      nodes.map(n => `N${n.id}:${n.current_load.toFixed(0)}MW/${n.trust_score.toFixed(0)}T`).join(' | ') +
      '   ');

  }, 100); // 10 ticks per second, matching C++ engine
}

main().catch(console.error);
