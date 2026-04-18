import { create } from 'zustand';

const useGridStore = create((set, get) => ({
  nodes: [],
  edges: [],
  logs: [], // Array of { level, timestamp, message } objects
  selectedNodeId: null,
  viewMode: '3d',
  connectionStatus: 'disconnected',

  // View routing — 'main' or 'scada'
  activeView: 'main',

  // The state variable for the engine's text
  decisionLog: 'System Stable. Monitoring packet flow.',
  simStatus: 'IDLE',
  activeScenario: null,
  activeAttackType: null,  // Tracks the type of attack selected/running
  attackStartTime: null,   // Global timestamp when attack was injected

  // Voice narration mute state
  voiceMuted: false,

  // Defence engine state — reflects backend-confirmed state
  isDefenseActive: true,  // Default ON (matches backend default)
  defensePending: false,   // True while waiting for backend confirmation

  // Edge attack highlight state — per-edge timers managed here
  edgeHighlights: {},  // { edgeId: { color, expiresAt } }

  // Navigation actions
  navigateToScada: (nodeId) => set({ activeView: 'scada', selectedNodeId: nodeId }),
  navigateToMain: () => set({ activeView: 'main', selectedNodeId: null }),

  setViewMode: (mode) => set({ viewMode: mode }),
  setDecisionLog: (log) => set({ decisionLog: log }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setNodes: (nodes) => set({ nodes: nodes || [] }),
  setEdges: (edges) => set({ edges: edges || [] }),

  toggleVoiceMute: () => set((state) => ({ voiceMuted: !state.voiceMuted })),

  // Defence state set from backend confirmation — NOT optimistic
  setDefenseState: (active) => set({ isDefenseActive: active, defensePending: false }),
  setDefensePending: () => set({ defensePending: true }),

  // Attack tracking
  setActiveAttack: (type) => set({ activeAttackType: type, attackStartTime: Date.now() }),
  clearActiveAttack: () => set({ activeAttackType: null, attackStartTime: null }),

  // Edge highlight management
  setEdgeHighlight: (edgeId, color) => set((state) => ({
    edgeHighlights: {
      ...state.edgeHighlights,
      [edgeId]: { color, expiresAt: Date.now() + 2500 },
    }
  })),
  clearEdgeHighlight: (edgeId) => set((state) => {
    const copy = { ...state.edgeHighlights };
    delete copy[edgeId];
    return { edgeHighlights: copy };
  }),

  // Adds to the log feed history (Safely formats strings into objects)
  addLog: (logData) => set((state) => {
    let newLog = logData;

    // If the backend sent a raw string, convert it to the object the UI needs
    if (typeof logData === 'string') {
      const lowerStr = logData.toLowerCase();
      let level = 'info';
      if (lowerStr.includes('critical') || lowerStr.includes('compromised') || lowerStr.includes('breached')) level = 'critical';
      else if (lowerStr.includes('warning') || lowerStr.includes('isolated') || lowerStr.includes('blocked')) level = 'warning';

      newLog = {
        level: level,
        timestamp: new Date().toISOString(),
        message: logData
      };
    }

    // Deduplicate: skip if the most recent log has the same message
    if (state.logs.length > 0 && state.logs[0].message === newLog.message) {
      return state;
    }

    // Keep the last 50 logs to prevent memory leaks
    return { logs: [newLog, ...state.logs].slice(0, 50) };
  }),

  toggleDefense: () => set((state) => ({
    isDefenseActive: !state.isDefenseActive
  })),

  // THE FIX: Wipes the array clean
  clearLogs: () => set({ logs: [] }),

  startSimulation: (type) => set({ simStatus: 'RUNNING', activeScenario: type, activeAttackType: type, attackStartTime: Date.now() }),
  stopSimulation: () => set({ simStatus: 'IDLE', activeScenario: null, activeAttackType: null, attackStartTime: null }),

  // Unified update function for the high-speed telemetry
  updateFromServer: (data) => set((state) => ({
    nodes: data.nodes || [],
    edges: data.edges || [],
    decisionLog: data.decision_log || state.decisionLog,
    connectionStatus: 'connected'
  })),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
}));

export default useGridStore;