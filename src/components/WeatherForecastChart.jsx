import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Helper to map WMO weather codes to icons and descriptions
export const getWeatherInfo = (code) => {
  const codes = {
    0: { label: 'Clear Sky', icon: 'bi-sun-fill text-warning' },
    1: { label: 'Mainly Clear', icon: 'bi-cloud-sun-fill text-secondary' },
    2: { label: 'Partly Cloudy', icon: 'bi-cloud-sun text-secondary' },
    3: { label: 'Overcast', icon: 'bi-cloud-fill text-secondary' },
    45: { label: 'Fog', icon: 'bi-cloud-fog-fill text-muted' },
    48: { label: 'Depositing Rime Fog', icon: 'bi-cloud-fog2-fill text-muted' },
    51: { label: 'Light Drizzle', icon: 'bi-cloud-drizzle text-info' },
    53: { label: 'Moderate Drizzle', icon: 'bi-cloud-drizzle-fill text-info' },
    55: { label: 'Dense Drizzle', icon: 'bi-cloud-drizzle-fill text-primary' },
    56: { label: 'Light Freezing Drizzle', icon: 'bi-cloud-hail text-info' },
    57: { label: 'Dense Freezing Drizzle', icon: 'bi-cloud-hail-fill text-primary' },
    61: { label: 'Slight Rain', icon: 'bi-cloud-rain text-info' },
    63: { label: 'Moderate Rain', icon: 'bi-cloud-rain-fill text-info' },
    65: { label: 'Heavy Rain', icon: 'bi-cloud-rain-heavy-fill text-primary' },
    66: { label: 'Light Freezing Rain', icon: 'bi-cloud-sleet text-info' },
    67: { label: 'Heavy Freezing Rain', icon: 'bi-cloud-sleet-fill text-primary' },
    71: { label: 'Slight Snowfall', icon: 'bi-cloud-snow text-info' },
    73: { label: 'Moderate Snowfall', icon: 'bi-cloud-snow-fill text-info' },
    75: { label: 'Heavy Snowfall', icon: 'bi-cloud-snow-heavy-fill text-primary' },
    77: { label: 'Snow Grains', icon: 'bi-cloud-snow text-muted' },
    80: { label: 'Slight Rain Showers', icon: 'bi-cloud-rain text-info' },
    81: { label: 'Moderate Rain Showers', icon: 'bi-cloud-rain-fill text-info' },
    82: { label: 'Violent Rain Showers', icon: 'bi-cloud-rain-heavy-fill text-primary' },
    85: { label: 'Slight Snow Showers', icon: 'bi-cloud-snow text-info' },
    86: { label: 'Heavy Snow Showers', icon: 'bi-cloud-snow-fill text-primary' },
    95: { label: 'Thunderstorm', icon: 'bi-cloud-lightning-fill text-warning' },
    96: { label: 'Thunderstorm with Hail', icon: 'bi-cloud-lightning-rain-fill text-warning' },
    99: { label: 'Heavy Thunderstorm with Hail', icon: 'bi-cloud-lightning-rain-fill text-danger' },
  };
  return codes[code] || { label: 'Unknown', icon: 'bi-question-circle-fill text-muted' };
};

const WeatherForecastChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-muted p-5 text-center bg-light rounded-4 border border-secondary-subtle">
        <i className="bi bi-cloud-slash fs-1 mb-2 d-block opacity-50"></i>
        No weather forecast data available. Please trigger a manual run in Settings or verify this station's coordinates.
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map(item => {
    const d = new Date(item.forecast_time);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      temp: parseFloat(item.temperature_2m),
      humidity: parseFloat(item.relative_humidity_2m),
      rainProb: parseFloat(item.precipitation_probability),
      rainVolume: parseFloat(item.precipitation_mm || item.rain_mm || item.showers_mm || 0),
      rawTime: item.forecast_time
    };
  });

  // Take the first 5 records (next 5 hours) for a premium mini hourly forecast widget
  const hourlySummary = data.slice(0, 5).map(item => {
    const d = new Date(item.forecast_time);
    const weather = getWeatherInfo(item.weather_code);
    return {
      id: item.id,
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: `${Math.round(item.temperature_2m)}°C`,
      rainProb: `${item.precipitation_probability}%`,
      icon: weather.icon,
      label: weather.label
    };
  });

  return (
    <div>
      {/* 5-Hour Quick Forecast Cards */}
      <h6 className="fw-bold mb-3 text-secondary text-uppercase small tracking-wide">Next 5 Hours Overview</h6>
      <div className="row g-2 mb-4">
        {hourlySummary.map((hour, index) => (
          <div className="col" key={hour.id || index} style={{ minWidth: '120px' }}>
            <div className="card border-0 bg-light shadow-xs text-center py-3 rounded-4 border border-secondary-subtle">
              <div className="text-muted small fw-semibold">{hour.time}</div>
              <div className="my-2 fs-3">
                <i className={`bi ${hour.icon}`}></i>
              </div>
              <div className="fw-bold fs-5 text-dark">{hour.temp}</div>
              <div className="text-primary small" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-droplet-fill me-1"></i>
                {hour.rainProb}
              </div>
              <div className="text-muted text-truncate px-2" style={{ fontSize: '0.65rem' }}>
                {hour.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dual Axis Weather Trend Chart */}
      <h6 className="fw-bold mb-3 text-secondary text-uppercase small tracking-wide">Forecast Trends (Temperature & Rainfall)</h6>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11, fill: '#6c757d' }} 
              axisLine={false} 
              tickLine={false} 
            />
            {/* Left Y-Axis for Temperature */}
            <YAxis 
              yAxisId="left"
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { fill: '#6c757d', fontSize: 12 }, offset: -5 }}
              tick={{ fontSize: 11, fill: '#6c757d' }} 
              axisLine={false} 
              tickLine={false} 
              domain={['auto', 'auto']}
            />
            {/* Right Y-Axis for Rain and Probability */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: 'Rain / Probability', angle: 90, position: 'insideRight', style: { fill: '#6c757d', fontSize: 12 }, offset: 5 }}
              tick={{ fontSize: 11, fill: '#6c757d' }} 
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
            />
            
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '12px'
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  return `${payload[0].payload.date} at ${label}`;
                }
                return label;
              }}
            />
            <Legend verticalAlign="top" height={40} iconType="circle" />
            
            {/* Rain probability Area (Translucent Blue) */}
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="rainProb" 
              name="Rain Probability (%)" 
              fill="#0d6efd" 
              stroke="none"
              fillOpacity={0.12} 
            />

            {/* Rain volume Bar (Cyan) */}
            <Bar 
              yAxisId="right"
              dataKey="rainVolume" 
              name="Precipitation (mm)" 
              fill="#0dcaf0" 
              barSize={12} 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />

            {/* Temperature Line (Orange) */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="temp" 
              name="Temperature (°C)" 
              stroke="#fd7e14" 
              strokeWidth={3}
              dot={{ r: 2, fill: '#fd7e14', strokeWidth: 1 }}
              activeDot={{ r: 5 }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeatherForecastChart;
