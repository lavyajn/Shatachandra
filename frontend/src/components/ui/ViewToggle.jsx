// ViewToggle.jsx — 3D ↔ 2D subdued pill toggle with status legend
import useGridStore from '../../store/useGridStore';

export default function ViewToggle() {
  const viewMode = useGridStore((s) => s.viewMode);
  const setViewMode = useGridStore((s) => s.setViewMode);

  return (
    <div className="view-toggle">
      <div className="pill-group">
        <button
          className={`pill ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => setViewMode('3d')}
        >
          3D
        </button>
        <button
          className={`pill ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => setViewMode('2d')}
        >
          2D
        </button>
      </div>

      {/* Status Legend */}
      <div className="status-legend">
        <div className="legend-item">
          <span className="legend-icon shield-icon" />
          <span className="legend-label">Aegis Shield (Protected)</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon attack-icon" />
          <span className="legend-label">Target Acquired (Breach)</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon normal-icon" />
          <span className="legend-label">Normal Operation</span>
        </div>
      </div>
    </div>
  );
}
