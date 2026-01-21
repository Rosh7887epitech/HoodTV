/**
 * DistributionChart Component
 * Donut chart displaying COVID-19 case distribution (Active, Recovered, Deaths)
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlobalStats } from '../services/api';

interface DistributionChartProps {
  stats: GlobalStats | null;
  loading?: boolean;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 h-[400px] flex items-center justify-center hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
        <div className="text-slate-400 text-lg">Loading distribution data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 h-[400px] flex items-center justify-center hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
        <div className="text-slate-400 text-lg">No data available</div>
      </div>
    );
  }

  // Prepare data for the donut chart
  const data = [
    { name: 'Active Cases', value: stats.active, color: '#FF9800' },
    { name: 'Recovered', value: stats.recovered, color: '#4CAF50' },
    { name: 'Deaths', value: stats.deaths, color: '#666666' },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / (stats.confirmed || 1)) * 100).toFixed(1);
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-slate-300">
            {formatNumber(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
      <h2 className="text-xl font-bold text-white mb-4">Case Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};