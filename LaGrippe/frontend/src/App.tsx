/**
 * Main App Component
 * COVID-19 DataViz Dashboard - Epitech Project
 */

import { useState, useEffect, useCallback } from 'react';
import { FaVirus, FaSkullCrossbones, FaHeartbeat, FaExclamationTriangle } from 'react-icons/fa';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StatCard } from './components/StatCard';
import { CovidMap } from './components/CovidMap';
import { TrendChart } from './components/TrendChart';
import { CountryComparison } from './components/CountryComparison';
import { CountrySelector } from './components/CountrySelector';
import { CountryDetail } from './components/CountryDetail';
import { PredictionPanel } from './components/PredictionPanel';
import { DistributionChart } from './components/DistributionChart';
import { 
  covidApi, 
  GlobalStats, 
  MapResponse, 
  HistoryResponse 
} from './services/api';

function App() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapLoading, setMapLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [stats, history, dates] = await Promise.all([
        covidApi.getGlobalStats(),
        covidApi.getHistoryData(),
        covidApi.getAvailableDates(),
      ]);

      setGlobalStats(stats);
      setHistoryData(history);
      setAvailableDates(dates);
      
      if (dates.length > 0) {
        const latestDate = dates[dates.length - 1];
        setSelectedDate(latestDate);
        const map = await covidApi.getMapData(latestDate);
        setMapData(map);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load COVID-19 data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = useCallback(async (date: string) => {
    setSelectedDate(date);
    setMapLoading(true);
    setError(null);
    
    try {
      console.log('Fetching map data for date:', date);
      const map = await covidApi.getMapData(date);
      console.log('Map data received:', map.locations.length, 'locations');
      setMapData(map);
    } catch (err) {
      console.error('Error fetching map data for date:', err);
      setError(`Failed to load data for ${date}`);
    } finally {
      setMapLoading(false);
    }
  }, []);

  const formatLastUpdate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header loading={loading} />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-8 flex items-center space-x-3">
            <FaExclamationTriangle className="text-red-400 text-xl flex-shrink-0" />
            <div>
              <p className="text-red-200 font-medium">Error Loading Data</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {globalStats && !loading && (
          <div className="mb-6 text-center">
            <p className="text-slate-400 text-sm">
              Last Updated: {formatLastUpdate(globalStats.last_update)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Confirmed"
            value={globalStats?.confirmed || 0}
            icon={FaVirus}
            color="text-covid-confirmed"
            loading={loading}
          />
          <StatCard
            title="Total Deaths"
            value={globalStats?.deaths || 0}
            icon={FaSkullCrossbones}
            color="text-covid-deaths"
            loading={loading}
          />
          <StatCard
            title="Total Recovered"
            value={(globalStats?.confirmed || 0) - (globalStats?.deaths || 0)}
            icon={FaHeartbeat}
            color="text-covid-recovered"
            loading={loading}
          />
          <StatCard
            title="Active Cases"
            value={globalStats?.active || 0}
            icon={FaExclamationTriangle}
            color="text-covid-active"
            loading={loading}
          />
        </div>

        {globalStats && (
          <div className="mb-8">
            <DistributionChart stats={globalStats} loading={loading} />
          </div>
        )}

        <div className="mb-8">
          <CovidMap 
            locations={mapData?.locations || []} 
            loading={loading || mapLoading}
            availableDates={availableDates}
            selectedDate={selectedDate || undefined}
            onDateChange={handleDateChange}
          />
        </div>

        <div className="mb-8">
          <TrendChart 
            data={historyData} 
            loading={loading}
          />
        </div>

        <div className="mb-8">
          <CountryComparison />
        </div>

        <div className="mb-8">
          <PredictionPanel />
        </div>

        <div className="mb-8">
          <CountrySelector onSelectCountry={(country) => setSelectedCountry(country)} />
        </div>
      </main>

      <Footer />

      {selectedCountry && (
        <CountryDetail
          countryName={selectedCountry}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
}

export default App;
