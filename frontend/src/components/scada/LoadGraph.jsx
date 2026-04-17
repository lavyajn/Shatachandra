// LoadGraph.jsx — Recharts line chart for load history
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';

export default function LoadGraph({ node }) {
  const history = node.history?.load || [];
  const capacity = node.capacity;
  const predictedLoad = node.predictedLoad;

  const data = history.map((val, i) => ({
    time: -(history.length - 1 - i) * 0.1,
    load: parseFloat(val.toFixed(1)),
  }));

  return (
    <div className="panel span-2" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title">📈 Load History</div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={9}
              tickFormatter={(v) => `${v}s`}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748b"
              fontSize={9}
              domain={[0, Math.ceil(capacity * 1.2)]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #1e293b',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}
              labelFormatter={(l) => `${l}s`}
              formatter={(value) => [`${value} MW`, 'Load']}
            />
            <ReferenceLine
              y={capacity}
              stroke="#ef4444"
              strokeDasharray="5 3"
              label={{ value: 'CAPACITY', position: 'right', fill: '#ef4444', fontSize: 9 }}
            />
            {predictedLoad != null && (
              <ReferenceLine
                y={predictedLoad}
                stroke="#f97316"
                strokeDasharray="4 4"
                label={{ value: 'PREDICTED', position: 'right', fill: '#f97316', fontSize: 9 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="load"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
