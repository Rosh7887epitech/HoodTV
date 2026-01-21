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

export interface CountryDetailStats {
  name: string;
  total_confirmed: number;
  total_deaths: number;
  total_recovered: number;
  total_active: number;
  mortality_rate: number;
  recovery_rate: number;
  dates: string[];
  confirmed_history: number[];
  deaths_history: number[];
  recovered_history: number[];
  active_history: number[];
  daily_new_cases: number[];
  daily_new_deaths: number[];
  locations: LocationData[];
  peak_date: string;
  peak_value: number;
  last_update: string;
}

export interface LinearPredictions {
  dates: string[];
  confirmed: number[];
  deaths: number[];
}

export interface PolynomialTrend {
  confirmed: number[];
  deaths: number[];
  confirmed_r2: number;
  deaths_r2: number;
}

export interface PredictionResponse {
  current_value: number;
  current_deaths: number;
  linear_predictions: LinearPredictions;
  polynomial_trend: PolynomialTrend;
  growth_rate: number;
  days_to_10_percent_increase: number | null;
  threshold_10_percent: number;
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

  async getCountryDetail(countryName: string): Promise<CountryDetailStats> {
    const response = await apiClient.get<CountryDetailStats>(
      `/stats/country-detail/${encodeURIComponent(countryName)}`
    );
    return response.data;
  },

  async getPredictions(): Promise<PredictionResponse> {
    const response = await apiClient.get<PredictionResponse>('/stats/predictions');
    return response.data;
  },

  async getCountryPredictions(countryName: string): Promise<PredictionResponse> {
    const response = await apiClient.get<PredictionResponse>(
      `/stats/predictions/${encodeURIComponent(countryName)}`
    );
    return response.data;
  },
};

export default apiClient;
