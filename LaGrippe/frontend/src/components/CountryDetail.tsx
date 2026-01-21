/**
 * CountryDetail Component
 * Displays detailed statistics for a specific country with a mini-map
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { 
  FaVirus, 
  FaSkullCrossbones, 
  FaHeartbeat, 
  FaExclamationTriangle,
  FaChartLine,
  FaCalendarAlt,
  FaPercent,
  FaTimes
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { covidApi, CountryDetailStats } from '../services/api';
import { PredictionPanel } from './PredictionPanel';
import 'leaflet/dist/leaflet.css';

interface CountryDetailProps {
  countryName: string;
  onClose: () => void;
}

export function CountryDetail({ countryName, onClose }: CountryDetailProps) {
  const [data, setData] = useState<CountryDetailStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'cumulative' | 'daily'>('cumulative');

  useEffect(() => {
    const fetchCountryDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const countryData = await covidApi.getCountryDetail(countryName);
        setData(countryData);
      } catch (err) {
        console.error('Error fetching country detail:', err);
        setError(`Failed to load data for ${countryName}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryDetail();
  }, [countryName]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getRadius = (confirmed: number): number => {
    if (confirmed === 0) return 0;
    return Math.max(5, Math.log10(confirmed + 1) * 4);
  };

  const getColor = (confirmed: number): string => {
    if (confirmed > 10000000) return '#8B0000';
    if (confirmed > 1000000) return '#DC143C';
    if (confirmed > 100000) return '#FF4444';
    if (confirmed > 10000) return '#FF6B6B';
    return '#FFA07A';
  };

  // Prepare chart data (sample every 30 days for better performance)
  const getChartData = () => {
    if (!data) return [];
    
    const sampleRate = 30; // Show every 30th day
    const chartData = [];
    
    for (let i = 0; i < data.dates.length; i += sampleRate) {
      chartData.push({
        date: data.dates[i],
        confirmed: data.confirmed_history[i],
        deaths: data.deaths_history[i],
        recovered: data.recovered_history[i],
        active: data.active_history[i],
        newCases: data.daily_new_cases[i],
        newDeaths: data.daily_new_deaths[i],
      });
    }
    
    // Always include the last data point
    const lastIndex = data.dates.length - 1;
    if (lastIndex % sampleRate !== 0) {
      chartData.push({
        date: data.dates[lastIndex],
        confirmed: data.confirmed_history[lastIndex],
        deaths: data.deaths_history[lastIndex],
        recovered: data.recovered_history[lastIndex],
        active: data.active_history[lastIndex],
        newCases: data.daily_new_cases[lastIndex],
        newDeaths: data.daily_new_deaths[lastIndex],
      });
    }
    
    return chartData;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-slate-900/50 rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-lg shadow-blue-500/30 border-2 border-white/20">
          <div className="text-center text-slate-400">Loading country details...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-slate-900/50 rounded-lg p-8 max-w-6xl w-full mx-4 shadow-lg shadow-blue-500/30 border-2 border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-red-400">Error</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
          <p className="text-slate-300">{error || 'Failed to load country data'}</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/50 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-lg shadow-blue-500/30 border-2 border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/50 border-b border-white/20 p-6 flex justify-between items-center z-10 shadow-lg shadow-blue-500/30">
          <h2 className="text-3xl font-bold text-white">{data.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <FaVirus className="text-blue-400 text-2xl" />
                <span className="text-slate-400 text-sm">Total Cases</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(data.total_confirmed)}</p>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 border border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <FaSkullCrossbones className="text-red-400 text-2xl" />
                <span className="text-slate-400 text-sm">Total Deaths</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(data.total_deaths)}</p>
              <p className="text-sm text-slate-400 mt-1">
                <FaPercent className="inline mr-1" size={12} />
                {data.mortality_rate}% mortality rate
              </p>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <FaHeartbeat className="text-green-400 text-2xl" />
                <span className="text-slate-400 text-sm">Total Recovered</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(data.total_recovered)}</p>
              <p className="text-sm text-slate-400 mt-1">
                <FaPercent className="inline mr-1" size={12} />
                {data.recovery_rate}% recovery rate
              </p>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 border border-yellow-500/30">
              <div className="flex items-center justify-between mb-2">
                <FaExclamationTriangle className="text-yellow-400 text-2xl" />
                <span className="text-slate-400 text-sm">Active Cases</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(data.total_active)}</p>
            </div>
          </div>

          {/* Peak Information */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center space-x-3">
              <FaChartLine className="text-purple-400 text-xl" />
              <div>
                <p className="text-slate-400 text-sm">Peak Cases</p>
                <p className="text-white text-lg font-semibold">
                  {formatNumber(data.peak_value)} cases
                </p>
              </div>
              <div className="ml-auto flex items-center space-x-2">
                <FaCalendarAlt className="text-slate-400" />
                <p className="text-slate-300">{data.peak_date}</p>
              </div>
            </div>
          </div>

          {/* Map and Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mini Map */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
              {data.locations.length > 0 ? (
                <div className="h-[400px] rounded-lg overflow-hidden">
                  <MapContainer
                    center={[data.locations[0].lat, data.locations[0].long]}
                    zoom={4}
                    className="h-full w-full"
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {data.locations.map((location, idx) => (
                      <CircleMarker
                        key={idx}
                        center={[location.lat, location.long]}
                        radius={getRadius(location.confirmed)}
                        fillColor={getColor(location.confirmed)}
                        color="#fff"
                        weight={1}
                        opacity={0.8}
                        fillOpacity={0.6}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold">{location.province}</p>
                            <p>Confirmed: {formatNumber(location.confirmed)}</p>
                            <p>Deaths: {formatNumber(location.deaths)}</p>
                            <p>Recovered: {formatNumber(location.recovered)}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-400">
                  No geographic data available
                </div>
              )}
            </div>

            {/* Daily Statistics */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Daily Changes</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-30)}>
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
                    />
                    <Legend />
                    <Bar dataKey="newCases" fill="#3B82F6" name="New Cases" />
                    <Bar dataKey="newDeaths" fill="#EF4444" name="New Deaths" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Historical Trends</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartView('cumulative')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    chartView === 'cumulative'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Cumulative
                </button>
                <button
                  onClick={() => setChartView('daily')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    chartView === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Daily New
                </button>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                  />
                  <Legend />
                  {chartView === 'cumulative' ? (
                    <>
                      <Line type="monotone" dataKey="confirmed" stroke="#3B82F6" name="Confirmed" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="deaths" stroke="#EF4444" name="Deaths" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="recovered" stroke="#10B981" name="Recovered" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="active" stroke="#F59E0B" name="Active" strokeWidth={2} dot={false} />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="newCases" stroke="#3B82F6" name="New Cases" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="newDeaths" stroke="#EF4444" name="New Deaths" strokeWidth={2} dot={false} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predictions Panel */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <PredictionPanel countryName={data.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
