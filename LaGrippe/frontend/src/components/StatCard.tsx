/**
 * StatCard Component
 * Displays a single COVID-19 statistic with icon and formatting
 */

import React from 'react';
import { IconType } from 'react-icons';

interface StatCardProps {
  title: string;
  value: number;
  icon: IconType;
  color: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  loading = false 
}) => {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide">
          {title}
        </h3>
        <Icon className={`text-2xl ${color}`} />
      </div>
      
      {loading ? (
        <div className="h-10 bg-slate-700 rounded animate-pulse"></div>
      ) : (
        <div className={`text-3xl font-bold ${color}`}>
          {formatNumber(value)}
        </div>
      )}
    </div>
  );
};
