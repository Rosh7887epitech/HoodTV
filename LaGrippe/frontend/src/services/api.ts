/**
 * COVID-19 API Service
 * Handles all HTTP requests to the FastAPI backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface GlobalStats {
  confirmed: number;
  deaths: number;
  recovered: number;
  active: number;
  last_update: string;
}

export interface LocationData {
  province: string;
  country: string;
  lat: number;
  long: number;
  confirmed: number;
  deaths: number;
  recovered: number;
  active: number;
}

export interface MapResponse {
  locations: LocationData[];
  total_locations: number;
  last_update: string;
}

export interface HistoryResponse {
  dates: string[];
  confirmed: number[];
  deaths: number[];
  recovered: number[];
  active: number[];
  total_days: number;
  last_update: string;
}

export interface CountryListItem {
  name: string;
  total_confirmed: number;
  total_deaths: number;
  total_recovered: number;
}

export interface CountryTimeSeriesData {
  country: string;
  dates: string[];
  confirmed: number[];
  deaths: number[];
  recovered: number[];
  active: number[];
}

export interface CountryComparisonResponse {
  countries: CountryTimeSeriesData[];
  dates: string[];
  last_update: string;
}

export const covidApi = {
  async getGlobalStats(): Promise<GlobalStats> {
    const response = await apiClient.get<GlobalStats>('/stats/global');
    return response.data;
  },

  async getMapData(date?: string): Promise<MapResponse> {
    const params = date ? { date } : {};
    const response = await apiClient.get<MapResponse>('/stats/map', { params });
    return response.data;
  },


  async getAvailableDates(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/stats/available-dates');
    return response.data;
  },

  async getHistoryData(): Promise<HistoryResponse> {
    const response = await apiClient.get<HistoryResponse>('/stats/history');
    return response.data;
  },

  async getCountriesList(): Promise<CountryListItem[]> {
    const response = await apiClient.get<CountryListItem[]>('/stats/countries');
    return response.data;
  },

  async compareCountries(countries: string[]): Promise<CountryComparisonResponse> {
    const response = await apiClient.get<CountryComparisonResponse>(
      '/stats/compare',
      { 
        params: { countries },
        paramsSerializer: {
          indexes: null, // This removes the brackets from array params
        }
      }
    );
    return response.data;
  },

  async clearCache(): Promise<void> {
    await apiClient.post('/stats/cache/clear');
  },
};

export default apiClient;
