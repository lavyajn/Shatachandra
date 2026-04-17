// simulationEngine.js — Core Simulation Loop (500ms tick)
const { clamp, randomDrift, getNeighborIds, getNodeById, createLogEntry } = require('./utils');
const { applyAttack, applyRecovery } = require('./attackEngine');
const { runAllPredictions } = require('./predictionEngine');

const TICK_INTERVAL = 500; // ms
const HISTORY_MAX = 60;

let simulationInterval = null;
let nodes = [];
let edges = [];
let logs = [];
let emitCallback = null;

const MAX_LOGS = 200;

function addLog(message, level = "info") {
  const entry = createLogEntry(message, level);
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  if (emitCallback) {
    emitCallback('grid:log', entry);
  }
  return entry;
}

/**
 * Initialize the simulation with fresh node and edge data.
 */
function init(initialNodes, initialEdges, emit) {
  nodes = initialNodes;
  edges = initialEdges;
  logs = [];
  emitCallback = emit;
  addLog('🟢 Simulation engine initialized — All systems nominal', 'info');
}

function getState() {
  return { nodes, edges, logs: logs.slice(-100) };
}

function getNodes() {
  return nodes;
}

function getEdges() {
  return edges;
}

/**
 * Simulation tick — called every 500ms
 */
function tick() {
  try {
    // 1. Normal fluctuation for non-attacked, non-isolated nodes
    for (const node of nodes) {
      if (node.status === 'isolated') continue;

      if (!node.attackActive) {
        // Random drift ±2% of baseLoad
        const drift = randomDrift(node.baseLoad, 2);
        node.currentLoad += drift;
        node.currentLoad = clamp(
          node.currentLoad,
          node.baseLoad * 0.85,
          node.capacity * 0.90
        );
        node.trueLoad = node.currentLoad;
        node.displayedLoad = node.currentLoad;

        // Normal packet rate fluctuation
        node.packetRate = node.basePacketRate + Math.round(randomDrift(node.basePacketRate, 5));
        node.packetRate = Math.max(node.packetRate, 10);

        // Apply recovery for previously attacked nodes
        applyRecovery(node);
      }
    }

    // 2. Attack propagation
    for (const node of nodes) {
      if (node.status === 'isolated') continue;
      if (node.attackActive) {
        applyAttack(node, nodes, edges);
      }
    }

    // 3. Cascade: overloaded nodes spill to neighbors
    for (const node of nodes) {
      if (node.status === 'isolated') continue;
      if (node.currentLoad > node.capacity * 0.85) {
        const neighborIds = getNeighborIds(node.id, edges);
        for (const nid of neighborIds) {
          const neighbor = getNodeById(nodes, nid);
          if (neighbor && neighbor.status !== 'isolated') {
            const spillover = neighbor.capacity * 0.08;
            neighbor.currentLoad += spillover;
            neighbor.trueLoad = neighbor.currentLoad;
            neighbor.displayedLoad = neighbor.currentLoad;
          }
        }
      }
    }

    // 4. Status derivation
    const previousStatuses = {};
    for (const node of nodes) {
      previousStatuses[node.id] = node.status;

      if (node.status === 'isolated') continue;

      if (node.currentLoad < node.capacity * 0.7) {
        node.status = 'normal';
      } else if (node.currentLoad < node.capacity * 0.9) {
        node.status = 'high';
      } else {
        node.status = 'compromised';
      }

      // Log status changes
      if (previousStatuses[node.id] !== node.status) {
        if (node.status === 'high') {
          addLog(`⚠ Node ${node.id} load exceeded 70% — Status: HIGH`, 'warn');
        } else if (node.status === 'compromised') {
          addLog(`🔴 Node ${node.id} load exceeded 90% — Status: COMPROMISED`, 'error');
        } else if (node.status === 'normal' && previousStatuses[node.id] !== 'normal') {
          addLog(`🟢 Node ${node.id} returned to normal operating range`, 'success');
        }
      }
    }

    // 5. History update
    for (const node of nodes) {
      node.history.load.push(node.currentLoad);
      node.history.packetRate.push(node.packetRate);
      node.history.maliciousRate.push(node.maliciousPacketRate);

      if (node.history.load.length > HISTORY_MAX) node.history.load.shift();
      if (node.history.packetRate.length > HISTORY_MAX) node.history.packetRate.shift();
      if (node.history.maliciousRate.length > HISTORY_MAX) node.history.maliciousRate.shift();
    }

    // 6. Edge stress update
    for (const edge of edges) {
      const srcNode = getNodeById(nodes, edge.source);
      const tgtNode = getNodeById(nodes, edge.target);
      if (srcNode && tgtNode) {
        const avgLoad = (srcNode.currentLoad + tgtNode.currentLoad) / 2;
        const maxCapacity = Math.max(srcNode.capacity, tgtNode.capacity);
        edge.currentFlow = (avgLoad / maxCapacity) * edge.baseCapacity;
        edge.stressed = edge.currentFlow > edge.baseCapacity * 0.8;
      }
    }

    // 7. Run prediction engine
    runAllPredictions(nodes);

    // 8. Auto response
    for (const node of nodes) {
      if (node.status === 'isolated') continue;

      if (node.predictedRisk === 'critical' && !node.responseActions.includes('rate_limiting')) {
        // Try load redistribution first
        const neighborIds = getNeighborIds(node.id, edges);
        let redistributed = false;

        for (const nid of neighborIds) {
          const neighbor = getNodeById(nodes, nid);
          if (neighbor && neighbor.status !== 'isolated' && neighbor.currentLoad < neighbor.capacity * 0.85) {
            // Shift 15% of overloaded node's load to this neighbor
            const shiftAmount = node.currentLoad * 0.15;
            node.currentLoad -= shiftAmount;
            node.trueLoad = node.currentLoad;
            node.displayedLoad = node.currentLoad;
            neighbor.currentLoad += shiftAmount;
            neighbor.trueLoad = neighbor.currentLoad;
            neighbor.displayedLoad = neighbor.currentLoad;

            if (!node.responseActions.includes('load_redistribution')) {
              node.responseActions.push('load_redistribution');
            }
            node.responseActions.push('rate_limiting');

            const msg = `→ 15% load (${shiftAmount.toFixed(1)}MW) shifted to Node ${nid}`;
            node.decisionLog.push(msg);
            if (node.decisionLog.length > 10) node.decisionLog.shift();
            addLog(`🛡 Load redistribution: ${shiftAmount.toFixed(1)}MW shifted from Node ${node.id} to Node ${nid}`, 'success');
            addLog(`🔮 Prediction: Node ${node.id} failure in ${node.timeToFailure || '?'}s — Response Active`, 'warn');

            redistributed = true;
            break;
          }
        }

        if (!redistributed) {
          // All neighbors overloaded — isolate as last resort
          const noCapMsg = `→ Redistribution failed — no available capacity among neighbors`;
          node.decisionLog.push(noCapMsg);
          node.decisionLog.push(`→ Initiating emergency isolation of Node ${node.id}`);
          if (node.decisionLog.length > 10) node.decisionLog = node.decisionLog.slice(-10);

          node.status = 'isolated';
          node.attackActive = false;
          node.attackType = null;
          node.attackStartTime = null;
          node.maliciousPacketRate = 0;
          if (!node.responseActions.includes('isolation')) {
            node.responseActions.push('isolation');
          }

          addLog(`🔒 Node ${node.id} ISOLATED — All redistribution options exhausted`, 'error');
        } else {
          const decisionMsg = `→ Immediate isolation rejected: redistribution capacity available`;
          if (!node.decisionLog.includes(decisionMsg)) {
            node.decisionLog.unshift(decisionMsg);
            if (node.decisionLog.length > 10) node.decisionLog = node.decisionLog.slice(-10);
          }
        }
      }

      // Monitor cascade risk on neighbors
      if (node.attackActive) {
        const neighborIds = getNeighborIds(node.id, edges);
        for (const nid of neighborIds) {
          const neighbor = getNodeById(nodes, nid);
          if (neighbor && neighbor.status === 'high') {
            const msg = `→ Monitoring cascade risk on Node ${nid}`;
            if (!node.decisionLog.includes(msg)) {
              node.decisionLog.push(msg);
              if (node.decisionLog.length > 10) node.decisionLog.shift();
            }
          }
        }
      }
    }

    // 9. Check for catastrophic failure (all nodes compromised)
    const activeNodes = nodes.filter(n => n.status !== 'isolated');
    const allCompromised = activeNodes.length > 0 && activeNodes.every(n => n.status === 'compromised');
    if (allCompromised) {
      addLog('💀 CATASTROPHIC FAILURE — All nodes compromised! Auto-reset in 5 seconds...', 'error');
      if (emitCallback) {
        emitCallback('grid:catastrophic_failure', { message: 'All nodes compromised' });
      }
      // Schedule auto-reset
      setTimeout(() => {
        if (emitCallback) {
          const { createInitialNodes, createInitialEdges } = require('./gridConfig');
          init(createInitialNodes(), createInitialEdges(), emitCallback);
          emitCallback('grid:reset', {});
          addLog('🔄 System auto-reset after catastrophic failure', 'info');
        }
      }, 5000);
    }

    // 10. Emit state
    if (emitCallback) {
      emitCallback('grid:state', getState());
    }
  } catch (error) {
    console.error('Simulation tick error:', error);
    // Don't crash the loop
  }
}

function start() {
  if (simulationInterval) return;
  simulationInterval = setInterval(tick, TICK_INTERVAL);
  addLog('▶ Simulation started', 'info');
}

function stop() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

function reset(initialNodes, initialEdges) {
  // Stop all attacks first
  for (const node of nodes) {
    if (node.attackActive) {
      node.attackActive = false;
      node.attackType = null;
      node.attackStartTime = null;
      node.maliciousPacketRate = 0;
    }
  }

  stop();
  init(initialNodes, initialEdges, emitCallback);
  start();
  addLog('🔄 Simulation reset — All systems restored to initial state', 'info');
}

/**
 * Manually isolate a node
 */
function isolateNode(nodeId) {
  const node = getNodeById(nodes, nodeId);
  if (!node) return { success: false, error: `Node ${nodeId} not found.` };
  if (node.status === 'isolated') return { success: false, error: `Node ${nodeId} is already isolated.` };

  node.status = 'isolated';
  node.attackActive = false;
  node.attackType = null;
  node.attackStartTime = null;
  node.maliciousPacketRate = 0;
  node.packetRate = 0;
  if (!node.responseActions.includes('isolation')) {
    node.responseActions.push('isolation');
  }

  addLog(`🔒 Node ${nodeId} manually isolated by operator`, 'warn');
  return { success: true, message: `Node ${nodeId} isolated.` };
}

/**
 * Restore an isolated node
 */
function restoreNode(nodeId) {
  const node = getNodeById(nodes, nodeId);
  if (!node) return { success: false, error: `Node ${nodeId} not found.` };
  if (node.status !== 'isolated') return { success: false, error: `Node ${nodeId} is not isolated.` };

  node.status = 'normal';
  node.currentLoad = node.baseLoad;
  node.trueLoad = node.baseLoad;
  node.displayedLoad = node.baseLoad;
  node.packetRate = node.basePacketRate;
  node.responseActions = [];

  addLog(`🔓 Node ${nodeId} restored to service by operator`, 'success');
  return { success: true, message: `Node ${nodeId} restored.` };
}

module.exports = {
  init,
  start,
  stop,
  reset,
  getState,
  getNodes,
  getEdges,
  isolateNode,
  restoreNode,
  addLog
};
