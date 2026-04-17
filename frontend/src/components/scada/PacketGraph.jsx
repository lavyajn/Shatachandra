// PacketGraph.jsx — Trust score history + packet rate area chart
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Line, ComposedChart } from 'recharts';

export default function PacketGraph({ node }) {
  const trustHistory = node.history?.trust || [];
  const packetHistory = node.history?.packetRate || [];
  const maliciousHistory = node.history?.maliciousRate || [];

  const data = packetHistory.map((val, i) => ({
    time: -(packetHistory.length - 1 - i) * 0.1, // backend2 ticks at 100ms
    normal: val,
    malicious: maliciousHistory[i] || 0,
    trust: trustHistory[i] ?? 100,
  }));

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title">📶 Traffic & Trust</div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={9}
              tickFormatter={(v) => `${v.toFixed(1)}s`}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="left" stroke="#64748b" fontSize={9} />
            <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={9} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #1e293b',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}
              labelFormatter={(l) => `${l}s`}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="normal"
              stackId="1"
              stroke="#3b82f6"
              fill="rgba(59,130,246,0.3)"
              isAnimationActive={false}
              name="Normal"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="malicious"
              stackId="1"
              stroke="#ef4444"
              fill="rgba(239,68,68,0.3)"
              isAnimationActive={false}
              name="Malicious"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="trust"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Trust %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
