import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const WaterLevelChart = ({ data, thresholds }) => {
  if (!data || data.length === 0) return <div className="text-muted p-4 text-center">No historical data available yet.</div>;

  // Format data for Recharts (reverse to show chronological order)
  const chartData = [...data].reverse().map(item => ({
    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(item.created_at).toLocaleDateString(),
    level: parseFloat(item.water_level_m),
    fullDate: item.created_at
  }));

  const { normal, alert, warning, danger } = thresholds;

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return `${payload[0].payload.date} ${label}`;
              }
              return label;
            }}
          />
          <Legend verticalAlign="top" height={36} />
          <Line 
            type="monotone" 
            dataKey="level" 
            name="Water Level (m)" 
            stroke="#0d6efd" 
            strokeWidth={3}
            dot={{ r: 3, fill: '#0d6efd', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }} 
          />
          {normal && <ReferenceLine y={normal} stroke="#198754" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Normal', fill: '#198754', fontSize: 12 }} />}
          {alert && <ReferenceLine y={alert} stroke="#ffc107" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Alert', fill: '#ffc107', fontSize: 12 }} />}
          {warning && <ReferenceLine y={warning} stroke="#fd7e14" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Warning', fill: '#fd7e14', fontSize: 12 }} />}
          {danger && <ReferenceLine y={danger} stroke="#dc3545" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Danger', fill: '#dc3545', fontSize: 12 }} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WaterLevelChart;
