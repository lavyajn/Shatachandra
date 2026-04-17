// LogFeed.jsx — Telemetry log feed with mute toggle for voice narration
import { useRef, useEffect, useState } from 'react';
import useGridStore from '../../store/useGridStore';
import { toggleMute } from '../../hooks/useSpeech';

export default function LogFeed() {
  const logs = useGridStore((s) => s.logs);
  const clearLogs = useGridStore((s) => s.clearLogs);
  const voiceMuted = useGridStore((s) => s.voiceMuted);

  const containerRef = useRef();
  const [autoScroll, setAutoScroll] = useState(true);

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

  const getLogStyles = (level) => {
    const lvl = (level || '').toLowerCase();
    if (lvl.includes('critical')) return { borderLeft: '3px solid #ff3333', color: '#ff9999', background: 'rgba(255, 51, 51, 0.04)' };
    if (lvl.includes('warning')) return { borderLeft: '3px solid #ffcc00', color: '#ffe680', background: 'rgba(255, 204, 0, 0.04)' };
    return { borderLeft: '3px solid #00ffcc', color: '#99ffeb', background: 'rgba(0, 255, 204, 0.03)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Header with Clear + Mute */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', flexShrink: 0, borderBottom: '1px solid rgba(0, 255, 204, 0.08)' }}>
        <span style={{ fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.12em', color: '#00ffcc' }}>Telemetry</span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Mute Toggle for Voice Narration */}
          <button
            className={`mute-btn ${voiceMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={voiceMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {voiceMuted ? '🔇' : '🔊'}
          </button>
          <button
            style={{
              padding: '3px 8px',
              fontSize: '9px',
              cursor: 'pointer',
              background: 'transparent',
              color: '#ff3333',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '3px',
              letterSpacing: '0.06em',
            }}
            onClick={clearLogs}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Auto-scrolling Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#444', fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginTop: '20px', letterSpacing: '0.06em' }}>
            Awaiting telemetry...
          </div>
        ) : (
          [...logs].reverse().map((entry, i) => (
            <div key={i} style={{
              fontSize: '9px',
              padding: '6px 8px',
              borderRadius: '0px 4px 4px 0px',
              lineHeight: 1.5,
              ...getLogStyles(entry.level)
            }}>
              <span style={{ opacity: 0.5, marginRight: '6px', color: '#888' }}>[{formatTime(entry.timestamp)}]</span>
              {entry.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}