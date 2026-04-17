// App.jsx — Root Layout with view-state routing
import { useState, useEffect, useRef } from 'react';
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
  const activeView = useGridStore((s) => s.activeView);
  const [transitioning, setTransitioning] = useState(false);
  const [displayView, setDisplayView] = useState(activeView);
  const prevView = useRef(activeView);

  // Handle view transitions with animation
  useEffect(() => {
    if (activeView !== prevView.current) {
      setTransitioning(true);
      // Brief delay for exit animation, then swap
      const timer = setTimeout(() => {
        setDisplayView(activeView);
        setTransitioning(false);
        prevView.current = activeView;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeView]);

  return (
    <div className="app-layout">
      {/* Global Alert Strip — persistent across views */}
      <GlobalAlertStrip />

      {/* Main Body — view swap area */}
      <div className="app-body">
        <div className="view-container">
          {/* View content with transition */}
          <div
            className={`view-panel ${transitioning ? 'exiting' : 'active'}`}
            key={displayView}
          >
            {displayView === 'main' ? (
              <div className="main-view">
                {/* View Toggle — only on main dashboard */}
                <ViewToggle />

                {/* 3D or 2D View with crossfade */}
                <div style={{
                  width: '100%',
                  height: '100%',
                }}>
                  {viewMode === '3d' ? <SceneCanvas /> : <NetworkGraph />}
                </div>
              </div>
            ) : (
              /* SCADA Dedicated View — full panel, no overlay */
              <ScadaDashboard />
            )}
          </div>

          {/* Incoming view (during transition) */}
          {transitioning && (
            <div className="view-panel entering">
              {activeView === 'main' ? (
                <div className="main-view">
                  <ViewToggle />
                  <div style={{ width: '100%', height: '100%' }}>
                    {viewMode === '3d' ? <SceneCanvas /> : <NetworkGraph />}
                  </div>
                </div>
              ) : (
                <ScadaDashboard />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Sidebar — rendered at root level, outside router outlet.
          Persists across both main and SCADA views without remounting. */}
      <Sidebar />
    </div>
  );
}
