/**
 * CountrySelector Component
 * Allows users to search and select a country to view details
 */

import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaGlobe } from 'react-icons/fa';
import { covidApi, CountryListItem } from '../services/api';

interface CountrySelectorProps {
  onSelectCountry: (countryName: string) => void;
}

export function CountrySelector({ onSelectCountry }: CountrySelectorProps) {
  const [countries, setCountries] = useState<CountryListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countryList = await covidApi.getCountriesList();
        setCountries(countryList);
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCountry = useCallback((countryName: string) => {
    onSelectCountry(countryName);
    setSearchTerm('');
    setShowDropdown(false);
  }, [onSelectCountry]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-6 shadow-lg shadow-blue-500/30 border-2 border-white/20 hover:bg-slate-900/60 hover:-translate-y-1 transition-all">
      <div className="flex items-center space-x-3 mb-4">
        <FaGlobe className="text-blue-400 text-2xl" />
        <h2 className="text-2xl font-bold text-white">Country Details</h2>
      </div>
      
      <p className="text-slate-400 mb-4">
        Search and select a country to view detailed statistics and trends
      </p>

      <div className="relative">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search country..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {showDropdown && searchTerm && filteredCountries.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            {filteredCountries.slice(0, 10).map((country) => (
              <button
                key={country.name}
                onClick={() => handleSelectCountry(country.name)}
                className="w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{country.name}</span>
                  <span className="text-slate-400 text-sm">
                    {formatNumber(country.total_confirmed)} cases
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchTerm && filteredCountries.length === 0 && (
          <div className="absolute z-10 w-full mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl p-4 text-center text-slate-400">
            No countries found
          </div>
        )}
      </div>

      {/* Top Countries Preview */}
      {!searchTerm && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Top Affected Countries</h3>
          <div className="space-y-2">
            {loading ? (
              <p className="text-slate-400 text-sm">Loading countries...</p>
            ) : (
              countries.slice(0, 5).map((country) => (
                <button
                  key={country.name}
                  onClick={() => handleSelectCountry(country.name)}
                  className="w-full text-left px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-medium">{country.name}</span>
                    <span className="text-slate-400 text-xs">
                      {formatNumber(country.total_confirmed)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
