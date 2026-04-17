import { useRef, useEffect, useState } from 'react';
import useGridStore from '../../store/useGridStore';

export default function LogFeed() {
  const logs = useGridStore((s) => s.logs);
  const clearLogs = useGridStore((s) => s.clearLogs);
  const decisionLog = useGridStore((s) => s.decisionLog);
  
  const containerRef = useRef();
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(isAtBottom);
  };

  const formatTime = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '--:--:--';
    }
  };

  // Helper for dynamic coloring based on alert level
  const getLogStyles = (level) => {
    const lvl = (level || '').toLowerCase();
    if (lvl.includes('critical')) return { borderLeft: '3px solid #ef4444', color: '#fca5a5' };
    if (lvl.includes('warning')) return { borderLeft: '3px solid #f59e0b', color: '#fcd34d' };
    return { borderLeft: '3px solid #10b981', color: '#cbd5e1' }; // Default Green
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, marginTop: '10px' }}>
      
      {/* 1. Header & Clear Button */}
      <div className="sidebar-section-title" style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>📋 Event Log</span>
        <button
          className="btn"
          style={{ 
            padding: '2px 8px', 
            fontSize: 10, 
            cursor: 'pointer', 
            background: 'rgba(239, 68, 68, 0.2)', 
            color: '#f87171', 
            border: '1px solid #ef4444', 
            borderRadius: '4px' 
          }}
          onClick={clearLogs}
        >
          Clear
        </button>
      </div>

      {/* 2. Live Engine Status */}
      <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#38bdf8', background: 'rgba(15, 23, 42, 0.5)', flexShrink: 0 }}>
        <strong style={{ color: '#94a3b8' }}>PREDICTIVE ENGINE:</strong> <br/>
        {decisionLog}
      </div>

      {/* 3. Auto-scrolling Feed */}
      <div
        ref={containerRef}
        className="log-feed"
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 11, padding: '8px', fontStyle: 'italic', textAlign: 'center' }}>
            No events yet...
          </div>
        ) : (
          /* Reversing so the newest logs appear at the very bottom for the auto-scroll */
          [...logs].reverse().map((entry, i) => (
            <div key={i} className={`log-entry ${entry.level}`} style={{
              fontSize: '11px',
              padding: '6px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              ...getLogStyles(entry.level)
            }}>
              <span className="timestamp" style={{ opacity: 0.7, marginRight: '6px' }}>[{formatTime(entry.timestamp)}]</span>
              {entry.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}