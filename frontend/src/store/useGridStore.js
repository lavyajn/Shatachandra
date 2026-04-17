import { create } from 'zustand';

const useGridStore = create((set) => ({
  nodes: [],
  edges: [],
  logs: [],
  selectedNodeId: null,
  viewMode: '3d',
  connectionStatus: 'disconnected',
  
  // The state variable for the engine's text
  decisionLog: 'System Stable. Monitoring packet flow.',
  
  simStatus: 'IDLE',
  activeScenario: null,

  // --- THE MISSING SETTERS ---
  
  // This fixes your current "socketClient.js:351" error
  setDecisionLog: (log) => set({ decisionLog: log }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setNodes: (nodes) => set({ nodes: nodes || [] }),
  setEdges: (edges) => set({ edges: edges || [] }),
  
  // Adds to the log feed history
  addLog: (log) => set((state) => ({ 
    logs: [log, ...state.logs].slice(0, 50) 
  })),

  startSimulation: (type) => set({ simStatus: 'RUNNING', activeScenario: type }),
  
  stopSimulation: () => set({ simStatus: 'IDLE', activeScenario: null }),

  // Unified update function for the high-speed telemetry
  updateFromServer: (data) => set((state) => ({
    nodes: data.nodes || [],
    edges: data.edges || [],
    // Update decision log only if it's provided in the ZMQ payload
    decisionLog: data.decision_log || state.decisionLog,
    connectionStatus: 'connected'
  })),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
}));

export default useGridStore;