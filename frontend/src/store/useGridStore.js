// useGridStore.js — Zustand Global Store
import { create } from 'zustand';

const useGridStore = create((set, get) => ({
  nodes: [],
  edges: [],
  logs: [],
  selectedNodeId: null,
  viewMode: '3d',
  connectionStatus: 'connecting',

  // Derived
  get activeAttacks() {
    const map = {};
    get().nodes.forEach(n => {
      if (n.attackActive) map[n.id] = n.attackType;
    });
    return map;
  },

  // Actions
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addLog: (entry) => set((state) => {
    const newLogs = [...state.logs, entry];
    if (newLogs.length > 200) {
      return { logs: newLogs.slice(-200) };
    }
    return { logs: newLogs };
  }),

  clearLogs: () => set({ logs: [] }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  resetState: () => set({
    nodes: [],
    edges: [],
    logs: [],
    selectedNodeId: null,
  }),

  // Update full state from server
  updateFromServer: (state) => set((prev) => {
    // Auto-clear selection if node no longer exists
    if (prev.selectedNodeId && !state.nodes.find(n => n.id === prev.selectedNodeId)) {
      return {
        nodes: state.nodes,
        edges: state.edges,
        selectedNodeId: null,
      };
    }
    return {
      nodes: state.nodes,
      edges: state.edges,
    };
  }),
}));

export default useGridStore;
