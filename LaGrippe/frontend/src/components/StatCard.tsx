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

  // Map color classes for border and shadow
  const getBorderColor = (colorClass: string): string => {
    return colorClass.replace('text-', 'border-');
  };

  const getShadowColor = (colorClass: string): string => {
    const colorMap: { [key: string]: string } = {
      'text-covid-confirmed': 'shadow-red-500/30',
      'text-covid-deaths': 'shadow-gray-500/30',
      'text-covid-recovered': 'shadow-green-500/30',
      'text-covid-active': 'shadow-orange-500/30',
    };
    return colorMap[colorClass] || 'shadow-blue-500/30';
  };

  return (
    <div className={`bg-slate-900/50 rounded-lg p-6 shadow-lg ${getShadowColor(color)} border-2 ${getBorderColor(color)} hover:-translate-y-1 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-medium uppercase tracking-wide">
          {title}
        </h3>
        <Icon className={`text-2xl ${color}`} />
      </div>
      
      {loading ? (
        <div className="h-10 bg-slate-700 rounded animate-pulse"></div>
      ) : (
        <div className={`text-3xl font-bold text-white`}>
          {formatNumber(value)}
        </div>
      )}
    </div>
  );
};
