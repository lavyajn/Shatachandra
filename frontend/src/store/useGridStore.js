import { create } from 'zustand';

const useGridStore = create((set) => ({
  nodes: [],
  edges: [],
  logs: [], // Array of { level, timestamp, message } objects
  selectedNodeId: null,
  viewMode: '3d',
  connectionStatus: 'disconnected',
  
  // The state variable for the engine's text
  decisionLog: 'System Stable. Monitoring packet flow.',
  simStatus: 'IDLE',
  activeScenario: null,

  setDecisionLog: (log) => set({ decisionLog: log }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setNodes: (nodes) => set({ nodes: nodes || [] }),
  setEdges: (edges) => set({ edges: edges || [] }),
  
  // Adds to the log feed history (Safely formats strings into objects)
  addLog: (logData) => set((state) => {
    let newLog = logData;
    
    // If the backend sent a raw string, convert it to the object the UI needs
    if (typeof logData === 'string') {
      const lowerStr = logData.toLowerCase();
      let level = 'info';
      if (lowerStr.includes('critical') || lowerStr.includes('compromised')) level = 'critical';
      else if (lowerStr.includes('warning') || lowerStr.includes('isolated')) level = 'warning';
      
      newLog = {
        level: level,
        timestamp: new Date().toISOString(),
        message: logData
      };
    }

    // Keep the last 50 logs to prevent memory leaks
    return { logs: [newLog, ...state.logs].slice(0, 50) };
  }),

  // THE FIX: Wipes the array clean
  clearLogs: () => set({ logs: [] }),

  startSimulation: (type) => set({ simStatus: 'RUNNING', activeScenario: type }),
  stopSimulation: () => set({ simStatus: 'IDLE', activeScenario: null }),

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