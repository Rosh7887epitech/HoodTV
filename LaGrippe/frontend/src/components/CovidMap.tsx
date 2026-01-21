/**
 * CovidMap Component
 * Interactive Leaflet map displaying COVID-19 cases worldwide
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LocationData } from '../services/api';
import 'leaflet/dist/leaflet.css';

interface CovidMapProps {
  locations: LocationData[];
  loading?: boolean;
  availableDates?: string[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

const MapBoundsFitter: React.FC<{ locations: LocationData[] }> = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map(loc => [loc.lat, loc.long] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
};

export const CovidMap: React.FC<CovidMapProps> = ({ 
  locations, 
  loading = false, 
  availableDates = [], 
  selectedDate,
  onDateChange 
}) => {
  const getRadius = (confirmed: number): number => {
    if (confirmed === 0) return 0;
    return Math.max(3, Math.log10(confirmed + 1) * 3);
  };

  const getColor = (confirmed: number): string => {
    if (confirmed > 10000000) return '#8B0000';
    if (confirmed > 1000000) return '#DC143C';
    if (confirmed > 100000) return '#FF4444';
    if (confirmed > 10000) return '#FF6B6B';
    return '#FFA07A';
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = '20' + parts[2];
      const date = new Date(`${year}-${month}-${day}`);
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 h-[600px] flex items-center justify-center hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
        <div className="text-slate-400 text-lg">Loading map data...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Global Distribution Map</h2>
        {selectedDate && (
          <span className="text-slate-300 text-sm">
            {formatDateDisplay(selectedDate)}
          </span>
        )}
      </div>

      {availableDates.length > 0 && onDateChange && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-4">
            <label htmlFor="date-slider" className="text-slate-300 text-sm font-medium whitespace-nowrap">
              Sélectionner une date:
            </label>
            <div className="flex-1">
              <input
                id="date-slider"
                type="range"
                min="0"
                max={availableDates.length - 1}
                value={selectedDate ? availableDates.indexOf(selectedDate) : availableDates.length - 1}
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  onDateChange(availableDates[index]);
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((selectedDate ? availableDates.indexOf(selectedDate) : availableDates.length - 1) / (availableDates.length - 1)) * 100}%, #334155 ${((selectedDate ? availableDates.indexOf(selectedDate) : availableDates.length - 1) / (availableDates.length - 1)) * 100}%, #334155 100%)`
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatDateDisplay(availableDates[0])}</span>
            <span>{formatDateDisplay(availableDates[availableDates.length - 1])}</span>
          </div>
        </div>
      )}

      <div className="h-[600px] rounded-lg overflow-hidden">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBoundsFitter locations={locations} />

          {locations.map((location, index) => (
            location.confirmed > 0 && (
              <CircleMarker
                key={`${selectedDate}-${location.country}-${location.province}-${index}-${location.confirmed}`}
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
                    <h3 className="font-bold text-base mb-2">
                      {location.province !== location.country 
                        ? `${location.province}, ${location.country}` 
                        : location.country}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-red-600">
                        <strong>Confirmed:</strong> {formatNumber(location.confirmed)}
                      </p>
                      <p className="text-gray-600">
                        <strong>Deaths:</strong> {formatNumber(location.deaths)}
                      </p>
                      <p className="text-green-600">
                        <strong>Recovered:</strong> {formatNumber(location.recovered)}
                      </p>
                      <p className="text-orange-600">
                        <strong>Active:</strong> {formatNumber(location.active)}
                      </p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          ))}
        </MapContainer>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Circle size represents case count (logarithmic scale)</span>
        <span>{locations.length} locations</span>
      </div>
    </div>
  );
};
