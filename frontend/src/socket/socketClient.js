// socketClient.js — WebSocket Client for backend2 (C++/ZMQ bridge)
import useGridStore from '../store/useGridStore';
import { speakDefenceAction } from '../hooks/useSpeech';

const WS_URL = 'ws://localhost:8080';

// ============ STATIC NODE CONFIG ============
// backend2 uses numeric IDs 0-4. Zero-indexed serial naming convention.

const NODE_CONFIG = {
  '0': {
    label: 'T1',
    position3D: { x: -5, y: 0, z: -8 },
    baseLoad: 20,
    basePacketRate: 120,
  },
  '1': {
    label: 'T2',
    position3D: { x: 5, y: 0, z: -8 },
    baseLoad: 30,
    basePacketRate: 150,
  },
  '2': {
    label: 'T3',
    position3D: { x: 10, y: 0, z: 0 },
    baseLoad: 40,
    basePacketRate: 100,
  },
  '3': {
    label: 'T4',
    position3D: { x: 5, y: 0, z: 8 },
    baseLoad: 15,
    basePacketRate: 130,
  },
  '4': {
    label: 'T5',
    position3D: { x: -5, y: 0, z: 8 },
    baseLoad: 35,
    basePacketRate: 110,
  },
  '5': {
    label: 'T6',
    position3D: { x: -10, y: 0, z: 0 },
    baseLoad: 25,
    basePacketRate: 140,
  },
};

// Static edge topology — 10-edge mesh for 6 towers (redundant power grid connections)
// T1(0)↔T2(1), T1(0)↔T3(2), T2(1)↔T3(2), T2(1)↔T4(3),
// T3(2)↔T4(3), T3(2)↔T5(4), T4(3)↔T5(4), T4(3)↔T6(5),
// T5(4)↔T6(5), T6(5)↔T1(0)
const STATIC_EDGES = [
  { id: '0-1', source: '0', target: '1', baseCapacity: 50, currentFlow: 10, stressed: false },
  { id: '0-2', source: '0', target: '2', baseCapacity: 45, currentFlow: 12, stressed: false },
  { id: '1-2', source: '1', target: '2', baseCapacity: 60, currentFlow: 20, stressed: false },
  { id: '1-3', source: '1', target: '3', baseCapacity: 40, currentFlow: 15, stressed: false },
  { id: '2-3', source: '2', target: '3', baseCapacity: 30, currentFlow: 10, stressed: false },
  { id: '2-4', source: '2', target: '4', baseCapacity: 55, currentFlow: 18, stressed: false },
  { id: '3-4', source: '3', target: '4', baseCapacity: 35, currentFlow: 12, stressed: false },
  { id: '3-5', source: '3', target: '5', baseCapacity: 42, currentFlow: 14, stressed: false },
  { id: '4-5', source: '4', target: '5', baseCapacity: 48, currentFlow: 16, stressed: false },
  { id: '5-0', source: '5', target: '0', baseCapacity: 38, currentFlow: 11, stressed: false },
];

function project3DTo2D(position3D) {
  // Center the 2D projection around the graph viewport center
  return {
    x: 400 + position3D.x * 22,
    y: 300 + position3D.z * 22,
  };
}

// ============ STATUS MAPPING ============

const STATUS_MAP = {
  0: 'normal',
  1: 'high',       // WARNING — AI intercepted, node online
  2: 'compromised', // Overloaded, bleeding load to neighbours
  3: 'isolated',    // Manual operator only
};

// ============ ATTACK TYPE LABELS FOR DEFENCE LOG ============

const ATTACK_ACTION_LABELS = {
  ddos: 'SYN flood',
  fdi: 'false data injection',
  spoofing: 'identity spoof',
};

// ============ CLIENT-SIDE STATE ============

const HISTORY_MAX = 60;

// Per-node history storage (persists across ticks)
const nodeHistories = {};
// Previous statuses for change detection
const prevStatuses = {};
// Track when nodes entered non-normal status (for attack duration)
const attackStartTimes = {};

function getOrCreateHistory(nodeId) {
  if (!nodeHistories[nodeId]) {
    nodeHistories[nodeId] = { load: [], packetRate: [], maliciousRate: [], trust: [] };
  }
  return nodeHistories[nodeId];
}

// ============ CLIENT-SIDE PREDICTION ============

function runClientPrediction(node, history) {
  const loadHistory = history.load;

  if (loadHistory.length < 3) {
    return { predictedLoad: null, predictedRisk: 'low', timeToFailure: null };
  }

  const windowSize = Math.min(10, loadHistory.length);
  const recent = loadHistory.slice(-windowSize);
  const slope = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);

  // Predicted load at t+5 ticks
  const predicted = node.currentLoad + slope * 5;
  const predictedLoad = Math.min(Math.max(predicted, 0), 150);

  let predictedRisk = 'low';
  if (predictedLoad < node.capacity * 0.7) predictedRisk = 'low';
  else if (predictedLoad < node.capacity * 0.85) predictedRisk = 'medium';
  else if (predictedLoad < node.capacity * 0.95) predictedRisk = 'high';
  else predictedRisk = 'critical';

  let timeToFailure = null;
  if (slope > 0 && node.currentLoad < node.capacity) {
    const ticksPerSecond = 10;
    const ttf = (node.capacity - node.currentLoad) / (slope * ticksPerSecond);
    timeToFailure = ttf > 0 && ttf <= 60 ? Math.round(ttf * 10) / 10 : null;
  }

  return { predictedLoad, predictedRisk, timeToFailure };
}

// ============ EDGE HIGHLIGHT MANAGER ============
// Sustained colour for 2500ms, then linear tween back over 800ms.

const edgeHighlightTimers = {};

function highlightAttackEdges(nodeId, isDefended) {
  const colour = isDefended ? '#f59e0b' : '#ef4444'; // amber for defended, red for breach
  const store = useGridStore.getState();

  // Find all edges connected to this node
  STATIC_EDGES.forEach(edge => {
    if (edge.source === nodeId || edge.target === nodeId) {
      // Set the highlight — this resets the 2500ms timer
      store.setEdgeHighlight(edge.id, colour);

      // Clear any existing timer for this edge
      if (edgeHighlightTimers[edge.id]) {
        clearTimeout(edgeHighlightTimers[edge.id]);
      }

      // Hold for 2500ms, then clear (tween handled in component)
      edgeHighlightTimers[edge.id] = setTimeout(() => {
        useGridStore.getState().clearEdgeHighlight(edge.id);
        delete edgeHighlightTimers[edge.id];
      }, 2500);
    }
  });
}

// ============ DATA TRANSFORMER ============

function transformBackend2Data(rawData) {
  const { nodes: rawNodes, decision_log, defense_active } = rawData;

  // Sync defence state from backend — this is the single source of truth
  const store = useGridStore.getState();
  if (defense_active !== undefined && store.isDefenseActive !== defense_active) {
    store.setDefenseState(defense_active);
  }

  const isDefenseActive = defense_active ?? store.isDefenseActive;

  // Collect status changes for log generation
  const statusChanges = [];
  // Collect defence actions for voice narration
  const defenceActions = [];

  // Transform nodes
  const nodes = rawNodes.map(rawNode => {
    const id = String(rawNode.id);
    const config = NODE_CONFIG[id] || {
      label: `Node ${id}`,
      position3D: { x: 0, y: 0, z: 0 },
      baseLoad: 20,
      basePacketRate: 100,
    };

    // Status comes directly from backend — backend handles defence logic now
    const status = STATUS_MAP[rawNode.status] ?? 'normal';
    const currentLoad = rawNode.load;
    const capacity = rawNode.capacity;
    const trust = rawNode.trust;

    // Detect attack state from backend status
    const isUnderAttack = status === 'high' || status === 'compromised';

    // Defence-specific: WARNING (1) = AI intercepted = attack was blocked
    const attackIntercepted = isDefenseActive && status === 'high';

    // Track attack start time
    if (isUnderAttack && !attackStartTimes[id]) {
      attackStartTimes[id] = new Date().toISOString();
    } else if (!isUnderAttack && attackStartTimes[id]) {
      attackStartTimes[id] = null;
    }

    // Trigger edge highlights when attack detected on a node
    if (isUnderAttack) {
      highlightAttackEdges(id, attackIntercepted);
    }

    // Determine attack type heuristic
    let attackType = null;
    if (isUnderAttack) {
      const loadRatio = currentLoad / capacity;
      if (loadRatio > 0.9) attackType = 'ddos';
      else if (trust < 50) attackType = 'fdi';
      else attackType = 'spoofing';
    }

    // Generate defence action labels for voice narration
    if (attackIntercepted) {
      const attackLabel = ATTACK_ACTION_LABELS[attackType || 'spoofing'] || 'anomaly';
      const actionMsg = `Blocked ${attackLabel} on Node ${id}`;
      // Only add if not already in this batch
      if (!defenceActions.includes(actionMsg)) {
        defenceActions.push(actionMsg);
      }
    }

    // Build history
    const history = getOrCreateHistory(id);
    history.load.push(currentLoad);
    if (history.load.length > HISTORY_MAX) history.load.shift();

    // Estimate packet-like metrics from trust changes
    const basePR = config.basePacketRate;
    const maliciousEstimate = isUnderAttack ? Math.round(basePR * (1 - trust / 100) * 3) : 0;
    const normalPR = basePR + Math.round((Math.random() * 2 - 1) * basePR * 0.05);
    history.packetRate.push(normalPR);
    history.maliciousRate.push(maliciousEstimate);
    history.trust.push(trust);
    if (history.packetRate.length > HISTORY_MAX) history.packetRate.shift();
    if (history.maliciousRate.length > HISTORY_MAX) history.maliciousRate.shift();
    if (history.trust.length > HISTORY_MAX) history.trust.shift();

    // Detect status change
    if (prevStatuses[id] !== undefined && prevStatuses[id] !== status) {
      statusChanges.push({ id, prevStatus: prevStatuses[id], newStatus: status, trust });
    }
    prevStatuses[id] = status;

    // Build node object
    const node = {
      id,
      label: `Node ${id}`,
      position3D: config.position3D,
      position2D: project3DTo2D(config.position3D),
      capacity,
      baseLoad: config.baseLoad,
      currentLoad,
      displayedLoad: currentLoad,
      trueLoad: currentLoad,
      status,
      trust,
      packetRate: normalPR,
      basePacketRate: basePR,
      maliciousPacketRate: maliciousEstimate,
      attackActive: isUnderAttack,
      attackIntercepted,
      attackType,
      attackStartTime: attackStartTimes[id] || null,
      predictedLoad: null,
      predictedRisk: 'low',
      timeToFailure: null,
      responseActions: [],
      decisionLog: [],
      history: {
        load: [...history.load],
        packetRate: [...history.packetRate],
        maliciousRate: [...history.maliciousRate],
        trust: [...history.trust],
      },
    };

    // Prediction
    const prediction = runClientPrediction(node, history);
    node.predictedLoad = prediction.predictedLoad;
    node.predictedRisk = prediction.predictedRisk;
    node.timeToFailure = prediction.timeToFailure;

    // Response actions derived from trust and status
    if (trust < 30) node.responseActions.push('rate_limiting');
    if (status === 'isolated') node.responseActions.push('isolation');
    if (currentLoad > capacity * 0.8) node.responseActions.push('load_redistribution');

    // Decision log from global decision_log
    if (decision_log && decision_log.length > 0) {
      const nodeIdNum = parseInt(id, 10);
      if (decision_log.includes(`Node ${nodeIdNum}`)) {
        node.decisionLog = decision_log.split('[').filter(s => s.length > 0).map(s => '→ [' + s);
      }
    }

    return node;
  });

  // Compute edge flows from node loads — only include edges where both nodes exist
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = STATIC_EDGES
    .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(edge => {
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    let currentFlow = edge.currentFlow;
    let stressed = false;

    if (srcNode && tgtNode) {
      const avgLoad = (srcNode.currentLoad + tgtNode.currentLoad) / 2;
      const maxCapacity = Math.max(srcNode.capacity, tgtNode.capacity);
      currentFlow = (avgLoad / maxCapacity) * edge.baseCapacity;
      stressed = currentFlow > edge.baseCapacity * 0.8;
    }

    return { ...edge, currentFlow, stressed };
  });

  return { nodes, edges, decisionLog: decision_log || '', statusChanges, defenceActions };
}

// ============ WEBSOCKET CONNECTION ============

let ws = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 10000;

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  useGridStore.getState().setConnectionStatus('connecting');

  try {
    ws = new WebSocket(WS_URL);
  } catch (err) {
    console.error('[WS] Failed to create WebSocket:', err);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[WS] Connected to backend2 bridge');
    useGridStore.getState().setConnectionStatus('connected');
    reconnectAttempts = 0;

    useGridStore.getState().addLog({
      timestamp: new Date().toISOString(),
      message: 'Connected to C++ Simulation Engine',
      level: 'info',
    });
  };

  ws.onmessage = (event) => {
    try {
      const rawData = JSON.parse(event.data);

      // Handle DEFENSE_STATE confirmation messages
      if (rawData.type === 'DEFENSE_STATE') {
        useGridStore.getState().setDefenseState(rawData.active);
        useGridStore.getState().addLog({
          timestamp: new Date().toISOString(),
          message: `Defence engine ${rawData.active ? 'ACTIVATED' : 'DEACTIVATED'} (confirmed by backend)`,
          level: rawData.active ? 'info' : 'warning',
        });
        return;
      }

      const transformed = transformBackend2Data(rawData);

      useGridStore.getState().updateFromServer({
        nodes: transformed.nodes,
        edges: transformed.edges,
      });

      // Update global decision log
      useGridStore.getState().setDecisionLog(transformed.decisionLog);

      // Generate logs from status changes
      const isDefenseActive = useGridStore.getState().isDefenseActive;

      for (const change of transformed.statusChanges) {
        if (!isDefenseActive) {
          // Defence OFF: attacks propagate freely
          if (change.newStatus === 'high') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `Node ${change.id} trust declining (${change.trust.toFixed(0)}%) — Status: WARNING`,
              level: 'warning',
            });
          } else if (change.newStatus === 'compromised') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `Node ${change.id} BREACHED — Trust: ${change.trust.toFixed(0)}% — bleeding load to neighbours`,
              level: 'critical',
            });
          } else if (change.newStatus === 'isolated') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `Node ${change.id} ISOLATED`,
              level: 'critical',
            });
          } else if (change.newStatus === 'normal' && change.prevStatus !== 'normal') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `Node ${change.id} recovered — Trust restored`,
              level: 'info',
            });
          }
        } else {
          // Defence ON: log AI actions
          if (change.newStatus === 'high') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `AI Firewall intercepting threat on Node ${change.id}`,
              level: 'info',
            });
          } else if (change.newStatus === 'normal' && change.prevStatus === 'high') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `Node ${change.id} stabilised — Firewall purged threat`,
              level: 'info',
            });
          }
        }
      }

      // Defence ON: speak defence actions
      if (isDefenseActive && transformed.defenceActions.length > 0) {
        for (const action of transformed.defenceActions) {
          useGridStore.getState().addLog({
            timestamp: new Date().toISOString(),
            message: action,
            level: 'info',
            isDefenceAction: true,
          });
          speakDefenceAction(action);
        }
      }

    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected');
    useGridStore.getState().setConnectionStatus('disconnected');
    scheduleReconnect();
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
    useGridStore.getState().setConnectionStatus('disconnected');
  };
}

function scheduleReconnect() {
  if (reconnectTimeout) return;
  reconnectAttempts++;
  const delay = Math.min(3000 * reconnectAttempts, MAX_RECONNECT_DELAY);
  console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connect();
  }, delay);
}

export function triggerScenario(type) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const payload = JSON.stringify({
      type: 'CONTROL',
      command: 'START_SCENARIO',
      scenario: type
    });
    ws.send(payload);
    console.log(`[WS] Triggered Scenario: ${type}`);
  }
}

export function stopScenario() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const payload = JSON.stringify({
      type: 'CONTROL',
      command: 'STOP_SCENARIO'
    });
    ws.send(payload);
    console.log(`[WS] Simulation Stopped`);
  }
}

/**
 * Unified command function to send signals to the Node.js bridge.
 * Handles both simple commands (STOP) and complex scenarios (START + Node ID).
 */
export function sendCommand(cmd, scenario = null, targetId = null) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const payload = JSON.stringify({ 
      type: 'CONTROL', 
      command: cmd, 
      scenario: scenario, 
      targetId: targetId 
    });
    
    ws.send(payload);
    console.log(`[WS] CONTROL Signal Sent: ${cmd} | Scenario: ${scenario} | Target: ${targetId}`);
  } else {
    console.error("[WS] Cannot send command: Connection is not open.");
  }
}

// Start connection
connect();

export default ws;
