/**
 * TrendChart Component
 * Line chart displaying historical COVID-19 trends
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { HistoryResponse } from '../services/api';

interface TrendChartProps {
  data: HistoryResponse | null;
  loading?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 h-[500px] flex items-center justify-center hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
        <div className="text-slate-400 text-lg">Loading trend data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 h-[500px] flex items-center justify-center hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
        <div className="text-slate-400 text-lg">No data available</div>
      </div>
    );
  }

  // Transform data for Recharts (sample every 7 days for better performance)
  const chartData = data.dates
    .map((date, index) => ({
      date,
      confirmed: data.confirmed[index],
      deaths: data.deaths[index],
      active: data.active[index],
    }))
    .filter((_, index) => index % 7 === 0 || index === data.dates.length - 1); // Weekly samples + last point

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
      <h2 className="text-xl font-bold text-white mb-4">Global Trends Over Time</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={formatNumber}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#fff',
            }}
            formatter={(value: number) => new Intl.NumberFormat('en-US').format(value)}
          />
          <Legend 
            wrapperStyle={{ color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="confirmed"
            stroke="#FF4444"
            strokeWidth={2}
            dot={false}
            name="Confirmed"
          />
          <Line
            type="monotone"
            dataKey="deaths"
            stroke="#666666"
            strokeWidth={2}
            dot={false}
            name="Deaths"
          />
          <Line
            type="monotone"
            dataKey="active"
            stroke="#FF9800"
            strokeWidth={2}
            dot={false}
            name="Active"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-xs text-slate-400 text-center">
        Showing {chartData.length} data points from {data.dates[0]} to {data.dates[data.dates.length - 1]}
      </div>
    </div>
  );
};
