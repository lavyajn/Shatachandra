// LogFeed.jsx — Timestamped scrollable log entries
import { useRef, useEffect, useState } from 'react';
import useGridStore from '../../store/useGridStore';

export default function LogFeed() {
  const logs = useGridStore((s) => s.logs);
  const clearLogs = useGridStore((s) => s.clearLogs);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="sidebar-section-title" style={{ padding: '0 8px', flexShrink: 0 }}>
        <span>📋 Event Log</span>
        <button
          className="btn"
          style={{ padding: '2px 8px', fontSize: 10 }}
          onClick={clearLogs}
        >
          Clear
        </button>
      </div>

      <div
        ref={containerRef}
        className="log-feed"
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px', fontStyle: 'italic' }}>
            No events yet...
          </div>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`log-entry ${entry.level}`}>
              <span className="timestamp">[{formatTime(entry.timestamp)}]</span>
              {entry.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
