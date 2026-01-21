/**
 * PredictionPanel Component
 * Displays COVID-19 predictions and trend analysis
 */

import { useState, useEffect } from 'react';
import { 
  FaChartLine, 
  FaCalendarAlt, 
  FaArrowUp, 
  FaInfoCircle,
} from 'react-icons/fa';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { covidApi, PredictionResponse } from '../services/api';

interface PredictionPanelProps {
  countryName?: string;
}

export function PredictionPanel({ countryName }: PredictionPanelProps) {
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = countryName 
          ? await covidApi.getCountryPredictions(countryName)
          : await covidApi.getPredictions();
        setPredictions(data);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError('Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [countryName]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const getChartData = () => {
    if (!predictions) return { historical: [], predictions: [], combined: [] };

    const sampleRate = 30;
    const historical = [];
    
    for (let i = 0; i < predictions.dates.length; i += sampleRate) {
      historical.push({
        date: predictions.dates[i],
        actual: predictions.polynomial_trend.confirmed[i],
        trend: predictions.polynomial_trend.confirmed[i],
      });
    }

    // Always include the last point
    const lastIndex = predictions.dates.length - 1;
    if (lastIndex % sampleRate !== 0) {
      historical.push({
        date: predictions.dates[lastIndex],
        actual: predictions.polynomial_trend.confirmed[lastIndex],
        trend: predictions.polynomial_trend.confirmed[lastIndex],
      });
    }

    const predictionData = predictions.linear_predictions.dates.map((date, i) => ({
      date,
      prediction: predictions.linear_predictions.confirmed[i],
    }));

    const combined = [
      ...historical,
      ...predictionData.map(p => ({
        date: p.date,
        actual: undefined,
        trend: undefined,
        prediction: p.prediction,
      }))
    ];

    return { historical, predictions: predictionData, combined };
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
        <div className="text-center text-slate-400">Loading predictions...</div>
      </div>
    );
  }

  if (error || !predictions) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
        <div className="text-center text-red-400">{error || 'No prediction data available'}</div>
      </div>
    );
  }

  const { combined } = getChartData();

  return (
    <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
      <div className="flex items-center space-x-3 mb-6">
        <FaChartLine className="text-purple-400 text-2xl" />
        <h2 className="text-2xl font-bold text-white">
          {countryName ? `Predictions for ${countryName}` : 'Global Predictions'}
        </h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <FaArrowUp className="text-blue-400" />
            <span className="text-slate-400 text-sm">Growth Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {predictions.growth_rate >= 0 ? '+' : ''}{predictions.growth_rate.toFixed(2)}%
          </p>
          <p className="text-slate-400 text-xs mt-1">Average (last 7 days)</p>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <FaCalendarAlt className="text-purple-400" />
            <span className="text-slate-400 text-sm">Days to +10%</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {predictions.days_to_10_percent_increase !== null 
              ? predictions.days_to_10_percent_increase === 0 
                ? 'Reached' 
                : `~${predictions.days_to_10_percent_increase}`
              : 'N/A'}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Target: {formatNumber(predictions.threshold_10_percent)}
          </p>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <FaInfoCircle className="text-green-400" />
            <span className="text-slate-400 text-sm">Model Accuracy</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(predictions.polynomial_trend.confirmed_r2 * 100).toFixed(1)}%
          </p>
          <p className="text-slate-400 text-xs mt-1">R² Score (Trend Fit)</p>
        </div>
      </div>

      {/* 7-Day Predictions Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <FaCalendarAlt className="text-blue-400" />
          <span>7-Day Linear Projections</span>
        </h3>
        <div className="bg-slate-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-slate-400 text-sm">Date</th>
                <th className="px-4 py-3 text-right text-slate-400 text-sm">Predicted Cases</th>
                <th className="px-4 py-3 text-right text-slate-400 text-sm">Predicted Deaths</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {predictions.linear_predictions.dates.map((date, i) => (
                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white text-sm">{date}</td>
                  <td className="px-4 py-3 text-right text-blue-400 text-sm font-medium">
                    {formatNumber(predictions.linear_predictions.confirmed[i])}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 text-sm font-medium">
                    {formatNumber(predictions.linear_predictions.deaths[i])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Chart with Predictions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <FaChartLine className="text-purple-400" />
          <span>Polynomial Trend & Future Projections</span>
        </h3>
        <div className="bg-slate-900 rounded-lg p-4">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend />
                
                {/* Historical trend line */}
                <Line 
                  type="monotone" 
                  dataKey="trend" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  name="Polynomial Trend"
                  dot={false}
                  connectNulls
                />
                
                {/* Future predictions */}
                <Line 
                  type="monotone" 
                  dataKey="prediction" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="7-Day Projection"
                  dot={{ fill: '#F59E0B', r: 4 }}
                  connectNulls
                />
                
                {/* Current position line */}
                <ReferenceLine
                  x={predictions.dates[predictions.dates.length - 1]}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Today', position: 'top', fill: '#EF4444' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-start space-x-2 text-xs text-slate-400">
            <FaInfoCircle className="flex-shrink-0 mt-0.5" />
            <p>
              The purple line shows the polynomial trend fitted to historical data (R² = {predictions.polynomial_trend.confirmed_r2.toFixed(4)}). 
              The dashed orange line represents linear projections for the next 7 days based on recent trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
