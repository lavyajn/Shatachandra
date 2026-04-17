// PredictionPanel.jsx — Load forecasting & risk display (USP)
import { RISK_COLORS } from '../../constants/theme';

export default function PredictionPanel({ node }) {
  const risk = node.predictedRisk || 'low';
  const riskColor = RISK_COLORS[risk] || RISK_COLORS.low;
  const isCritical = risk === 'critical';

  // Trend arrow based on load history
  let trendIcon = '→';
  let trendLabel = 'Stable';
  if (node.history && node.history.load && node.history.load.length >= 3) {
    const recent = node.history.load.slice(-5);
    const slope = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);
    if (slope > 1) { trendIcon = '↑'; trendLabel = 'Rising'; }
    else if (slope < -1) { trendIcon = '↓'; trendLabel = 'Falling'; }
  }

  return (
    <div
      className="panel"
      style={{
        background: isCritical ? 'rgba(127, 29, 29, 0.25)' : undefined,
        borderColor: isCritical ? 'rgba(239, 68, 68, 0.4)' : undefined,
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="panel-title">🔮 Prediction Engine</div>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{
          fontSize: 32,
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: riskColor,
          transition: 'color 0.3s',
        }}>
          {node.predictedLoad != null ? `${node.predictedLoad.toFixed(1)}` : '—'}
          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> MW</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Predicted Load (t+2.5s)
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
        <span className={`risk-badge ${risk}`}>
          {risk.toUpperCase()}
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          fontWeight: 600,
          color: trendIcon === '↑' ? '#ef4444' : trendIcon === '↓' ? '#10b981' : 'var(--text-secondary)',
        }}>
          {trendIcon} {trendLabel}
        </span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
        fontSize: 12,
      }}>
        <span style={{ color: 'var(--text-muted)' }}>Time to Failure</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 16,
          color: node.timeToFailure != null ? '#ef4444' : 'var(--text-muted)',
        }}>
          {node.timeToFailure != null ? `${node.timeToFailure.toFixed(1)}s` : '—'}
        </span>
      </div>
    </div>
  );
}
