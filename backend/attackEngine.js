// attackEngine.js — Attack Logic per Type
const { clamp, createLogEntry, getNeighborIds, getNodeById } = require('./utils');

/**
 * Apply False Data Injection attack effect per tick
 * - Spike currentLoad by +5% of capacity per tick
 * - maliciousPacketRate = packetRate * 0.15 (subtle injection)
 * - Does NOT modify packetRate itself
 */
function applyFDI(node) {
  const loadIncrease = node.capacity * 0.05;
  node.trueLoad += loadIncrease;
  node.currentLoad = node.trueLoad;
  node.displayedLoad = node.currentLoad;
  node.maliciousPacketRate = Math.round(node.packetRate * 0.15);
}

/**
 * Apply DDoS attack effect per tick
 * - Multiply packetRate by 8x of basePacketRate (surging)
 * - maliciousPacketRate = packetRate * 0.92 (92% garbage)
 * - Load increases by +2% per tick (secondary effect)
 */
function applyDDoS(node) {
  node.packetRate = node.basePacketRate * 8;
  node.maliciousPacketRate = Math.round(node.packetRate * 0.92);
  const loadIncrease = node.capacity * 0.02;
  node.currentLoad += loadIncrease;
  node.trueLoad = node.currentLoad;
  node.displayedLoad = node.currentLoad;
}

/**
 * Apply Spoofing attack effect per tick
 * - maliciousPacketRate = packetRate * 0.35
 * - Randomly flip the displayedLoad ±20% (falsified reading)
 * - trueLoad diverges from displayedLoad
 * - Connected nodes receive incorrect signals: +4% load drift on neighbors
 */
function applySpoofing(node, allNodes, edges) {
  node.maliciousPacketRate = Math.round(node.packetRate * 0.35);

  // True load drifts slightly upward
  node.trueLoad += node.capacity * 0.01;

  // Displayed load is falsified ±20% of true load
  const spoofFactor = 1 + (Math.random() * 0.4 - 0.2); // 0.8 to 1.2
  node.displayedLoad = node.trueLoad * spoofFactor;
  node.currentLoad = node.trueLoad; // actual load for simulation purposes

  // Connected nodes receive incorrect redistribution signals
  const neighborIds = getNeighborIds(node.id, edges);
  for (const nid of neighborIds) {
    const neighbor = getNodeById(allNodes, nid);
    if (neighbor && neighbor.status !== 'isolated') {
      neighbor.currentLoad += neighbor.capacity * 0.04;
      neighbor.trueLoad = neighbor.currentLoad;
      neighbor.displayedLoad = neighbor.currentLoad;
    }
  }
}

/**
 * Apply attack effects for a node based on its attackType
 */
function applyAttack(node, allNodes, edges) {
  if (!node.attackActive || !node.attackType) return;

  switch (node.attackType) {
    case 'fdi':
      applyFDI(node);
      break;
    case 'ddos':
      applyDDoS(node);
      break;
    case 'spoofing':
      applySpoofing(node, allNodes, edges);
      break;
  }
}

/**
 * Start an attack on a node
 * Returns a log entry or error message
 */
function startAttack(nodes, nodeId, attackType) {
  const node = getNodeById(nodes, nodeId);
  if (!node) {
    return { success: false, error: `Node ${nodeId} does not exist.` };
  }
  if (node.status === 'isolated') {
    return { success: false, error: `Cannot attack isolated node ${nodeId}.` };
  }
  if (node.attackActive) {
    return { success: false, error: `Node ${nodeId} is already under ${node.attackType.toUpperCase()} attack.` };
  }
  if (!['fdi', 'ddos', 'spoofing'].includes(attackType)) {
    return { success: false, error: `Invalid attack type: ${attackType}. Must be one of: fdi, ddos, spoofing.` };
  }

  node.attackActive = true;
  node.attackType = attackType;
  node.attackStartTime = new Date().toISOString();

  const attackLabels = { fdi: 'False Data Injection', ddos: 'DDoS', spoofing: 'Spoofing' };
  const log = createLogEntry(
    `🔴 ${attackLabels[attackType]} attack initiated on Node ${nodeId} (${node.label})`,
    'error'
  );

  return { success: true, message: `${attackLabels[attackType]} attack started on Node ${nodeId}.`, log };
}

/**
 * Stop an attack on a node, begin recovery
 */
function stopAttack(nodes, nodeId) {
  const node = getNodeById(nodes, nodeId);
  if (!node) {
    return { success: false, error: `Node ${nodeId} does not exist.` };
  }
  if (!node.attackActive) {
    return { success: false, error: `No active attack on Node ${nodeId}.` };
  }

  const attackType = node.attackType;
  node.attackActive = false;
  node.attackType = null;
  node.attackStartTime = null;
  node.maliciousPacketRate = 0;
  node.packetRate = node.basePacketRate;

  const log = createLogEntry(
    `✅ Attack stopped on Node ${nodeId} — Recovery initiated`,
    'success'
  );

  return { success: true, message: `Attack stopped on Node ${nodeId}. Recovery in progress.`, log };
}

/**
 * Recovery ramp-down: decrease load by 3% per tick toward baseLoad
 */
function applyRecovery(node) {
  if (node.attackActive || node.status === 'isolated') return;

  if (node.currentLoad > node.baseLoad * 1.05) {
    const decrease = node.capacity * 0.03;
    node.currentLoad = Math.max(node.baseLoad, node.currentLoad - decrease);
    node.trueLoad = node.currentLoad;
    node.displayedLoad = node.currentLoad;
  }

  // Recover packet rate
  if (node.packetRate > node.basePacketRate * 1.1) {
    node.packetRate = Math.max(node.basePacketRate, node.packetRate * 0.85);
  }
  if (node.maliciousPacketRate > 0) {
    node.maliciousPacketRate = Math.max(0, node.maliciousPacketRate - 10);
  }
}

module.exports = {
  applyAttack,
  startAttack,
  stopAttack,
  applyRecovery
};
