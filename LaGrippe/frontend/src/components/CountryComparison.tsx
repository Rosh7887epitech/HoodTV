/**
 * CountryComparison Component
 * Allows users to compare COVID-19 statistics across multiple countries
 */

import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaTimes, FaChartLine } from 'react-icons/fa';
import { covidApi, CountryListItem, CountryComparisonResponse } from '../services/api';
import { ComparisonChart } from './ComparisonChart';

export function CountryComparison() {
  const [availableCountries, setAvailableCountries] = useState<CountryListItem[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<CountryComparisonResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<'confirmed' | 'deaths' | 'recovered' | 'active'>('confirmed');

  // Fetch available countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countries = await covidApi.getCountriesList();
        setAvailableCountries(countries);
        
        // Pre-select top 3 countries by default
        if (countries.length >= 3) {
          const topCountries = countries.slice(0, 3).map(c => c.name);
          setSelectedCountries(topCountries);
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError('Failed to load countries list');
      }
    };

    fetchCountries();
  }, []);

  // Fetch comparison data when selected countries change
  useEffect(() => {
    if (selectedCountries.length === 0) {
      setComparisonData(null);
      return;
    }

    const fetchComparison = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await covidApi.compareCountries(selectedCountries);
        setComparisonData(data);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError('Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [selectedCountries]);

  const handleAddCountry = useCallback((countryName: string) => {
    if (selectedCountries.length >= 10) {
      setError('Maximum 10 countries can be compared');
      return;
    }
    
    if (!selectedCountries.includes(countryName)) {
      setSelectedCountries([...selectedCountries, countryName]);
    }
    
    setSearchTerm('');
  }, [selectedCountries]);

  const handleRemoveCountry = useCallback((countryName: string) => {
    setSelectedCountries(selectedCountries.filter(c => c !== countryName));
  }, [selectedCountries]);

  const filteredCountries = availableCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedCountries.includes(country.name)
  );

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center space-x-3 mb-6">
        <FaChartLine className="text-blue-400 text-2xl" />
        <h2 className="text-2xl font-bold text-white">Country Comparison</h2>
      </div>

      {/* Country Selection */}
      <div className="mb-6">
        <div className="relative mb-4">
          <div className="flex items-center bg-slate-700/50 rounded-lg px-4 py-3 border border-slate-600">
            <FaSearch className="text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search countries to add..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
              disabled={selectedCountries.length >= 10}
            />
          </div>

          {/* Search Results Dropdown */}
          {searchTerm && filteredCountries.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCountries.slice(0, 10).map((country) => (
                <button
                  key={country.name}
                  onClick={() => handleAddCountry(country.name)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-600 text-white transition-colors border-b border-slate-600 last:border-b-0"
                >
                  <div className="font-medium">{country.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {formatNumber(country.total_confirmed)} confirmed cases
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Countries */}
        <div className="flex flex-wrap gap-2">
          {selectedCountries.map((country) => (
            <div
              key={country}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full"
            >
              <span className="font-medium">{country}</span>
              <button
                onClick={() => handleRemoveCountry(country)}
                className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                aria-label={`Remove ${country}`}
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          ))}
        </div>

        {selectedCountries.length === 0 && (
          <p className="text-slate-400 text-sm mt-2">
            Select countries to compare their COVID-19 statistics
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400 mt-4">Loading comparison data...</p>
        </div>
      )}

      {/* Metric Selector */}
      {!loading && comparisonData && (
        <>
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {[
              { key: 'confirmed', label: 'Confirmed Cases', color: 'bg-blue-600' },
              { key: 'deaths', label: 'Deaths', color: 'bg-red-600' },
              { key: 'recovered', label: 'Recovered', color: 'bg-green-600' },
              { key: 'active', label: 'Active Cases', color: 'bg-amber-600' },
            ].map((metric) => (
              <button
                key={metric.key}
                onClick={() => setActiveMetric(metric.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeMetric === metric.key
                    ? `${metric.color} text-white`
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>

          {/* Comparison Chart */}
          <ComparisonChart
            countries={comparisonData.countries}
            metric={activeMetric}
            title={`${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Cases Comparison`}
          />

          {/* Statistics Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-slate-400 font-medium">Country</th>
                  <th className="pb-3 text-slate-400 font-medium text-right">Latest Confirmed</th>
                  <th className="pb-3 text-slate-400 font-medium text-right">Latest Deaths</th>
                  <th className="pb-3 text-slate-400 font-medium text-right">Latest Recovered</th>
                  <th className="pb-3 text-slate-400 font-medium text-right">Latest Active</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.countries.map((country) => {
                  const lastIndex = country.dates.length - 1;
                  return (
                    <tr key={country.country} className="border-b border-slate-700/50">
                      <td className="py-3 text-white font-medium">{country.country}</td>
                      <td className="py-3 text-blue-400 text-right">
                        {formatNumber(country.confirmed[lastIndex])}
                      </td>
                      <td className="py-3 text-red-400 text-right">
                        {formatNumber(country.deaths[lastIndex])}
                      </td>
                      <td className="py-3 text-green-400 text-right">
                        {formatNumber(country.recovered[lastIndex])}
                      </td>
                      <td className="py-3 text-amber-400 text-right">
                        {formatNumber(country.active[lastIndex])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
