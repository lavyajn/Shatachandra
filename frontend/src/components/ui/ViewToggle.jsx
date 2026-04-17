// ViewToggle.jsx — 3D ↔ 2D toggle button
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
          style={{ fontSize: 12 }}
        >
          🏙 3D City
        </button>
        <button
          className={`pill ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => setViewMode('2d')}
          style={{ fontSize: 12 }}
        >
          🔗 2D Network
        </button>
      </div>
    </div>
  );
}
