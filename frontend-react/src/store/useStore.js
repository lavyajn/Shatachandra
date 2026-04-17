import { create } from 'zustand';

const useStore = create((set) => ({
    nodes: [],
    decisionLog: "System Booting... Awaiting Telemetry Pipeline.",
    
    updateTelemetry: (data) => set({ 
        nodes: data.nodes, 
        decisionLog: data.decision_log 
    })
}));

export default useStore;