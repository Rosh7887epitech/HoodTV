/**
 * ComparisonChart Component
 * Displays comparative line charts for multiple countries
 */

import { useMemo } from 'react';
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
import { CountryTimeSeriesData } from '../services/api';

interface ComparisonChartProps {
  countries: CountryTimeSeriesData[];
  metric: 'confirmed' | 'deaths' | 'recovered' | 'active';
  title: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
];

export function ComparisonChart({ countries, metric, title }: ComparisonChartProps) {
  const chartData = useMemo(() => {
    if (!countries || countries.length === 0) return [];

    const dates = countries[0].dates;
    
    // Sample data to show last 60 days for better readability
    const sampleRate = Math.max(1, Math.floor(dates.length / 60));
    
    return dates
      .map((date, index) => {
        if (index % sampleRate !== 0 && index !== dates.length - 1) {
          return null;
        }
        
        const dataPoint: any = { date };
        
        countries.forEach((country) => {
          dataPoint[country.country] = country[metric][index];
        });
        
        return dataPoint;
      })
      .filter(Boolean);
  }, [countries, metric]);

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  if (!countries || countries.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
        <p className="text-slate-400">No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => {
              const [month, day] = value.split('/');
              return `${month}/${day}`;
            }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={formatNumber}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            formatter={(value: number) => [formatNumber(value), '']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend
            wrapperStyle={{ color: '#f1f5f9' }}
            iconType="line"
          />
          {countries.map((country, index) => (
            <Line
              key={country.country}
              type="monotone"
              dataKey={country.country}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
