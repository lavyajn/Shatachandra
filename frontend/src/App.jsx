// App.jsx — Root Layout
import { useEffect } from 'react';
import useGridStore from './store/useGridStore';
import './socket/socketClient'; // Initialize WebSocket connection on import
import SceneCanvas from './components/three/SceneCanvas';
import NetworkGraph from './components/graph/NetworkGraph';
import ScadaDashboard from './components/scada/ScadaDashboard';
import Sidebar from './components/sidebar/Sidebar';
import ViewToggle from './components/ui/ViewToggle';
import GlobalAlertStrip from './components/ui/GlobalAlertStrip';

export default function App() {
  const viewMode = useGridStore((s) => s.viewMode);
  const selectedNodeId = useGridStore((s) => s.selectedNodeId);

  return (
    <div className="app-layout">
      {/* Global Alert Strip */}
      <GlobalAlertStrip />

      {/* Main Body */}
      <div className="app-body">
        {/* Main View Area */}
        <div className="main-view">
          {/* View Toggle */}
          <ViewToggle />

          {/* 3D or 2D View */}
          <div style={{
            width: '100%',
            height: '100%',
            opacity: 1,
            transition: 'opacity 0.3s ease',
          }}>
            {viewMode === '3d' ? <SceneCanvas /> : <NetworkGraph />}
          </div>

          {/* SCADA Overlay */}
          {selectedNodeId && <ScadaDashboard />}
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </div>
  );
}
