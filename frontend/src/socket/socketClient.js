// socketClient.js — WebSocket Client for backend2 (C++/ZMQ bridge)
import useGridStore from '../store/useGridStore';
import { speakDefenceAction } from '../hooks/useSpeech';

const WS_URL = 'ws://localhost:8080';

// ============ STATIC NODE CONFIG ============
// backend2 uses numeric IDs 0-4. Zero-indexed serial naming convention.

const NODE_CONFIG = {
  '0': {
    label: 'Node 0',
    position3D: { x: -7, y: 0, z: -7 },
    baseLoad: 20,
    basePacketRate: 120,
  },
  '1': {
    label: 'Node 1',
    position3D: { x: 8, y: 0, z: -6 },
    baseLoad: 30,
    basePacketRate: 150,
  },
  '2': {
    label: 'Node 2',
    position3D: { x: 10, y: 0, z: 2 },
    baseLoad: 40,
    basePacketRate: 100,
  },
  '3': {
    label: 'Node 3',
    position3D: { x: 3, y: 0, z: 9 },
    baseLoad: 15,
    basePacketRate: 130,
  },
  '4': {
    label: 'Node 4',
    position3D: { x: -8, y: 0, z: 6 },
    baseLoad: 35,
    basePacketRate: 110,
  },
};

// Static edge topology matching the C++ graph
const STATIC_EDGES = [
  { id: '0-1', source: '0', target: '1', baseCapacity: 50, currentFlow: 10, stressed: false },
  { id: '1-2', source: '1', target: '2', baseCapacity: 60, currentFlow: 20, stressed: false },
  { id: '2-3', source: '2', target: '3', baseCapacity: 30, currentFlow: 10, stressed: false },
  { id: '1-4', source: '1', target: '4', baseCapacity: 40, currentFlow: 15, stressed: false },
];

function project3DTo2D(position3D) {
  return {
    x: 350 + position3D.x * 25,
    y: 250 + position3D.z * 20,
  };
}

// ============ STATUS MAPPING ============

const STATUS_MAP = {
  0: 'normal',
  1: 'high',       // backend2 calls it WARNING, we map to 'high' for frontend consistency
  2: 'compromised',
  3: 'isolated',
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
    const ticksPerSecond = 10; // backend2 runs at 10 ticks/sec (100ms intervals)
    const ttf = (node.capacity - node.currentLoad) / (slope * ticksPerSecond);
    timeToFailure = ttf > 0 && ttf <= 60 ? Math.round(ttf * 10) / 10 : null;
  }

  return { predictedLoad, predictedRisk, timeToFailure };
}

// ============ DATA TRANSFORMER ============

function transformBackend2Data(rawData) {
  const { nodes: rawNodes, decision_log } = rawData;
  const isDefenseActive = useGridStore.getState().isDefenseActive;

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

    const rawStatus = STATUS_MAP[rawNode.status] ?? 'normal';
    const currentLoad = rawNode.load;
    const capacity = rawNode.capacity;
    const trust = rawNode.trust;

    // Defence engine intercept logic
    let status = rawStatus;
    const isUnderAttack = rawStatus === 'high' || rawStatus === 'compromised';

    if (isDefenseActive && isUnderAttack) {
      // Defence ON: intercept attacks — keep node visually SECURE
      status = 'normal';

      // Determine what kind of attack was blocked
      const loadRatio = currentLoad / capacity;
      let attackType = 'spoofing';
      if (loadRatio > 0.9) attackType = 'ddos';
      else if (trust < 50) attackType = 'fdi';

      const attackLabel = ATTACK_ACTION_LABELS[attackType] || 'anomaly';

      // Generate defence action labels
      if (rawStatus === 'compromised') {
        const actionMsg = `Blocked ${attackLabel} on Node ${id}`;
        defenceActions.push(actionMsg);
      } else if (rawStatus === 'high') {
        const actionMsg = `Rate-limited Node ${id} ingress`;
        defenceActions.push(actionMsg);
      }
    }

    // Track attack start time (only when defence is OFF or for raw tracking)
    if (isUnderAttack && !attackStartTimes[id]) {
      attackStartTimes[id] = new Date().toISOString();
    } else if (!isUnderAttack && attackStartTimes[id]) {
      attackStartTimes[id] = null;
    }

    // Determine attack type heuristic
    let attackType = null;
    if (isUnderAttack) {
      const loadRatio = currentLoad / capacity;
      if (loadRatio > 0.9) attackType = 'ddos';
      else if (trust < 50) attackType = 'fdi';
      else attackType = 'spoofing';
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

    // Detect status change before updating
    if (prevStatuses[id] !== undefined && prevStatuses[id] !== status) {
      statusChanges.push({ id, prevStatus: prevStatuses[id], newStatus: status, rawStatus, trust });
    }
    prevStatuses[id] = status;

    // Run client-side prediction
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
      rawStatus, // original status from backend before defence intercept
      trust,
      packetRate: normalPR,
      basePacketRate: basePR,
      maliciousPacketRate: maliciousEstimate,
      attackActive: isUnderAttack, // true if backend reports attack, regardless of defence
      attackIntercepted: isDefenseActive && isUnderAttack, // true if defence blocked it
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

  // Compute edge flows from node loads
  const edges = STATIC_EDGES.map(edge => {
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
      const transformed = transformBackend2Data(rawData);

      useGridStore.getState().updateFromServer({
        nodes: transformed.nodes,
        edges: transformed.edges,
      });

      // Update global decision log
      useGridStore.getState().setDecisionLog(transformed.decisionLog);

      // Generate logs from status changes (collected during transform)
      const isDefenseActive = useGridStore.getState().isDefenseActive;

      for (const change of transformed.statusChanges) {
        if (!isDefenseActive) {
          // Defence OFF: attacks propagate freely
          if (change.rawStatus === 'high' || change.newStatus === 'high') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `Node ${change.id} trust declining (${change.trust.toFixed(0)}%) — Status: WARNING`,
              level: 'warning',
            });
          } else if (change.rawStatus === 'compromised' || change.newStatus === 'compromised') {
            useGridStore.getState().addLog({
              timestamp: new Date().toISOString(),
              message: `Node ${change.id} BREACHED — Trust: ${change.trust.toFixed(0)}%`,
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
        }
      }

      // Defence ON: log and speak defence actions
      if (isDefenseActive && transformed.defenceActions.length > 0) {
        for (const action of transformed.defenceActions) {
          useGridStore.getState().addLog({
            timestamp: new Date().toISOString(),
            message: action,
            level: 'info',
            isDefenceAction: true,
          });
          // Speak the defence action
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
  // Check if the global WebSocket instance (ws) is open
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
