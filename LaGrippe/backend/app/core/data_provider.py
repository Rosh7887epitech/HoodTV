

import pandas as pd
import json
import os
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CovidDataProvider:
    BASE_URL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series"
    
    DATASETS = {
        "confirmed": "time_series_covid19_confirmed_global.csv",
        "deaths": "time_series_covid19_deaths_global.csv",
        "recovered": "time_series_covid19_recovered_global.csv"
    }
    
    CACHE_DIR = Path("cache")
    CACHE_DURATION = timedelta(hours=6)
    
    def __init__(self):
        self.CACHE_DIR.mkdir(exist_ok=True)
        logger.info("CovidDataProvider initialized")
    
    def _get_cache_path(self, dataset_name: str) -> Path:
        return self.CACHE_DIR / f"{dataset_name}_cache.json"
    
    def _is_cache_valid(self, cache_path: Path) -> bool:
        if not cache_path.exists():
            return False
        
        try:
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
                cache_time = datetime.fromisoformat(cache_data.get('timestamp', ''))
                return datetime.now() - cache_time < self.CACHE_DURATION
        except (json.JSONDecodeError, ValueError, KeyError):
            return False
    
    def _load_from_cache(self, cache_path: Path) -> Optional[pd.DataFrame]:
        try:
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
                df = pd.read_json(cache_data['data'])
                logger.info(f"Loaded data from cache: {cache_path.name}")
                return df
        except Exception as e:
            logger.warning(f"Failed to load cache: {e}")
            return None
    
    def _save_to_cache(self, df: pd.DataFrame, cache_path: Path) -> None:
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'data': df.to_json(date_format='iso')
            }
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f)
            logger.info(f"Saved data to cache: {cache_path.name}")
        except Exception as e:
            logger.error(f"Failed to save cache: {e}")
    
    @lru_cache(maxsize=3)
    def _fetch_dataset(self, dataset_type: str) -> pd.DataFrame:
        if dataset_type not in self.DATASETS:
            raise ValueError(f"Invalid dataset type: {dataset_type}")
        
        cache_path = self._get_cache_path(dataset_type)
        
        if self._is_cache_valid(cache_path):
            cached_df = self._load_from_cache(cache_path)
            if cached_df is not None:
                return cached_df
        
        url = f"{self.BASE_URL}/{self.DATASETS[dataset_type]}"
        logger.info(f"Fetching data from GitHub: {dataset_type}")
        
        try:
            df = pd.read_csv(url)
            df = self._clean_dataframe(df)
            self._save_to_cache(df, cache_path)
            return df
        except Exception as e:
            logger.error(f"Failed to fetch {dataset_type}: {e}")
            raise
    
    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        if 'Province/State' in df.columns:
            df['Province/State'] = df['Province/State'].fillna(df['Country/Region'])
        
        if 'Lat' in df.columns:
            df['Lat'] = df['Lat'].fillna(0.0)
        if 'Long' in df.columns:
            df['Long'] = df['Long'].fillna(0.0)
        
        return df
    
    def get_confirmed_cases(self) -> pd.DataFrame:
        return self._fetch_dataset("confirmed")
    
    def get_deaths(self) -> pd.DataFrame:
        return self._fetch_dataset("deaths")
    
    def get_recovered(self) -> pd.DataFrame:
        return self._fetch_dataset("recovered")
    
    def get_all_datasets(self) -> Dict[str, pd.DataFrame]:
        return {
            "confirmed": self.get_confirmed_cases(),
            "deaths": self.get_deaths(),
            "recovered": self.get_recovered()
        }
    
    def get_latest_date(self, df: pd.DataFrame) -> str:
        date_columns = [col for col in df.columns if col not in 
                       ['Province/State', 'Country/Region', 'Lat', 'Long']]
        return date_columns[-1] if date_columns else None
    
    def get_global_totals(self) -> Dict[str, int]:
        datasets = self.get_all_datasets()
        
        totals = {}
        for name, df in datasets.items():
            latest_date = self.get_latest_date(df)
            if latest_date:
                totals[name] = int(df[latest_date].sum())
            else:
                totals[name] = 0
        
        totals['active'] = totals.get('confirmed', 0) - totals.get('deaths', 0)
        
        return totals
    
    def get_country_data(self, country: str) -> Dict[str, pd.DataFrame]:
        datasets = self.get_all_datasets()
        country_data = {}
        
        for name, df in datasets.items():
            filtered = df[df['Country/Region'] == country]
            country_data[name] = filtered
        
        return country_data
    
    def get_map_data(self, date: Optional[str] = None) -> List[Dict]:
        df_confirmed = self.get_confirmed_cases()
        df_deaths = self.get_deaths()
        df_recovered = self.get_recovered()
        
        if date:
            date_columns = [col for col in df_confirmed.columns if col not in 
                           ['Province/State', 'Country/Region', 'Lat', 'Long']]
            if date not in date_columns:
                raise ValueError(f"Date '{date}' not found in dataset. Available dates: {date_columns[0]} to {date_columns[-1]}")
            target_date = date
        else:
            target_date = self.get_latest_date(df_confirmed)
        
        map_data = []
        for idx, row in df_confirmed.iterrows():
            if row['Lat'] == 0 and row['Long'] == 0:
                continue
            
            confirmed = int(row[target_date]) if target_date else 0
            
            deaths_row = df_deaths[
                (df_deaths['Province/State'] == row['Province/State']) &
                (df_deaths['Country/Region'] == row['Country/Region'])
            ]
            recovered_row = df_recovered[
                (df_recovered['Province/State'] == row['Province/State']) &
                (df_recovered['Country/Region'] == row['Country/Region'])
            ]
            
            deaths = int(deaths_row[target_date].values[0]) if not deaths_row.empty and target_date else 0
            recovered = int(recovered_row[target_date].values[0]) if not recovered_row.empty and target_date else 0
            
            map_data.append({
                "province": row['Province/State'],
                "country": row['Country/Region'],
                "lat": float(row['Lat']),
                "long": float(row['Long']),
                "confirmed": confirmed,
                "deaths": deaths,
                "recovered": recovered,
                "active": confirmed - deaths - recovered
            })
        
        return map_data
    
    def get_time_series_history(self) -> Dict[str, List]:
        datasets = self.get_all_datasets()
        
        df_confirmed = datasets['confirmed']
        date_columns = [col for col in df_confirmed.columns if col not in 
                       ['Province/State', 'Country/Region', 'Lat', 'Long']]
        
        history = {
            "dates": date_columns,
            "confirmed": [],
            "deaths": [],
            "recovered": []
        }
        
        for date in date_columns:
            for name, df in datasets.items():
                total = int(df[date].sum())
                history[name].append(total)
        
        history['active'] = [
            c - d - r for c, d, r in zip(
                history['confirmed'],
                history['deaths'],
                history['recovered']
            )
        ]
        
        return history
    
    def get_available_dates(self) -> List[str]:
        df_confirmed = self.get_confirmed_cases()
        date_columns = [col for col in df_confirmed.columns if col not in 
                       ['Province/State', 'Country/Region', 'Lat', 'Long']]
        return date_columns
    
    def get_available_countries(self) -> List[Dict[str, any]]:
        datasets = self.get_all_datasets()
        df_confirmed = datasets['confirmed']
        df_deaths = datasets['deaths']
        df_recovered = datasets['recovered']
        
        latest_date = self.get_latest_date(df_confirmed)
        
        countries = []
        for country in df_confirmed['Country/Region'].unique():
            confirmed = int(df_confirmed[df_confirmed['Country/Region'] == country][latest_date].sum())
            deaths = int(df_deaths[df_deaths['Country/Region'] == country][latest_date].sum())
            recovered = int(df_recovered[df_recovered['Country/Region'] == country][latest_date].sum())
            
            countries.append({
                'name': country,
                'total_confirmed': confirmed,
                'total_deaths': deaths,
                'total_recovered': recovered
            })
        
        countries.sort(key=lambda x: x['total_confirmed'], reverse=True)
        return countries
    
    def get_countries_comparison(self, country_names: List[str]) -> Dict[str, any]:
        datasets = self.get_all_datasets()
        date_columns = self.get_available_dates()
        
        comparison_data = {
            'dates': date_columns,
            'countries': []
        }
        
        for country_name in country_names:
            country_series = {
                'country': country_name,
                'dates': date_columns,
                'confirmed': [],
                'deaths': [],
                'recovered': [],
                'active': []
            }
            
            for date in date_columns:
                confirmed = int(datasets['confirmed'][
                    datasets['confirmed']['Country/Region'] == country_name
                ][date].sum())
                
                deaths = int(datasets['deaths'][
                    datasets['deaths']['Country/Region'] == country_name
                ][date].sum())
                
                recovered = int(datasets['recovered'][
                    datasets['recovered']['Country/Region'] == country_name
                ][date].sum())
                
                active = confirmed - deaths - recovered
                
                country_series['confirmed'].append(confirmed)
                country_series['deaths'].append(deaths)
                country_series['recovered'].append(recovered)
                country_series['active'].append(active)
            
            comparison_data['countries'].append(country_series)
        
        return comparison_data
    
    def get_country_detail(self, country_name: str) -> Dict[str, any]:
        """Get detailed statistics and time series for a specific country"""
        datasets = self.get_all_datasets()
        date_columns = self.get_available_dates()
        latest_date = self.get_latest_date(datasets['confirmed'])
        
        # Get time series data
        confirmed_history = []
        deaths_history = []
        recovered_history = []
        active_history = []
        
        for date in date_columns:
            confirmed = int(datasets['confirmed'][
                datasets['confirmed']['Country/Region'] == country_name
            ][date].sum())
            
            deaths = int(datasets['deaths'][
                datasets['deaths']['Country/Region'] == country_name
            ][date].sum())
            
            recovered = int(datasets['recovered'][
                datasets['recovered']['Country/Region'] == country_name
            ][date].sum())
            
            active = confirmed - deaths - recovered
            
            confirmed_history.append(confirmed)
            deaths_history.append(deaths)
            recovered_history.append(recovered)
            active_history.append(active)
        
        # Calculate daily new cases
        daily_new_cases = [0] + [
            max(0, confirmed_history[i] - confirmed_history[i-1])
            for i in range(1, len(confirmed_history))
        ]
        
        daily_new_deaths = [0] + [
            max(0, deaths_history[i] - deaths_history[i-1])
            for i in range(1, len(deaths_history))
        ]
        
        # Get latest totals
        total_confirmed = confirmed_history[-1] if confirmed_history else 0
        total_deaths = deaths_history[-1] if deaths_history else 0
        total_recovered = recovered_history[-1] if recovered_history else 0
        total_active = active_history[-1] if active_history else 0
        
        # Calculate rates
        mortality_rate = (total_deaths / total_confirmed * 100) if total_confirmed > 0 else 0
        recovery_rate = (total_recovered / total_confirmed * 100) if total_confirmed > 0 else 0
        
        # Find peak
        peak_index = confirmed_history.index(max(confirmed_history)) if confirmed_history else 0
        peak_date = date_columns[peak_index] if date_columns else ""
        peak_value = confirmed_history[peak_index] if confirmed_history else 0
        
        # Get geographic locations for this country
        df_confirmed = datasets['confirmed']
        df_deaths = datasets['deaths']
        df_recovered = datasets['recovered']
        
        country_locations = []
        country_df = df_confirmed[df_confirmed['Country/Region'] == country_name]
        
        for idx, row in country_df.iterrows():
            if row['Lat'] == 0 and row['Long'] == 0:
                continue
            
            confirmed = int(row[latest_date]) if latest_date else 0
            
            deaths_row = df_deaths[
                (df_deaths['Province/State'] == row['Province/State']) &
                (df_deaths['Country/Region'] == row['Country/Region'])
            ]
            recovered_row = df_recovered[
                (df_recovered['Province/State'] == row['Province/State']) &
                (df_recovered['Country/Region'] == row['Country/Region'])
            ]
            
            deaths = int(deaths_row[latest_date].values[0]) if not deaths_row.empty and latest_date else 0
            recovered = int(recovered_row[latest_date].values[0]) if not recovered_row.empty and latest_date else 0
            
            country_locations.append({
                "province": row['Province/State'],
                "country": row['Country/Region'],
                "lat": float(row['Lat']),
                "long": float(row['Long']),
                "confirmed": confirmed,
                "deaths": deaths,
                "recovered": recovered,
                "active": confirmed - deaths - recovered
            })
        
        return {
            'name': country_name,
            'total_confirmed': total_confirmed,
            'total_deaths': total_deaths,
            'total_recovered': total_recovered,
            'total_active': total_active,
            'mortality_rate': round(mortality_rate, 2),
            'recovery_rate': round(recovery_rate, 2),
            'dates': date_columns,
            'confirmed_history': confirmed_history,
            'deaths_history': deaths_history,
            'recovered_history': recovered_history,
            'active_history': active_history,
            'daily_new_cases': daily_new_cases,
            'daily_new_deaths': daily_new_deaths,
            'locations': country_locations,
            'peak_date': peak_date,
            'peak_value': peak_value
        }
    
    def predict_linear(self, data: List[int], days: int = 7) -> List[float]:
        """
        Perform linear regression prediction for future days
        """
        if len(data) < 10:
            return []
        
        # Use last 30 days for prediction
        recent_data = data[-30:]
        X = np.arange(len(recent_data)).reshape(-1, 1)
        y = np.array(recent_data)
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict future values
        future_X = np.arange(len(recent_data), len(recent_data) + days).reshape(-1, 1)
        predictions = model.predict(future_X)
        
        # Ensure predictions are not negative
        predictions = np.maximum(predictions, 0)
        
        return predictions.tolist()
    
    def predict_polynomial(self, data: List[int], degree: int = 2) -> Tuple[List[float], float]:
        """
        Fit polynomial regression to data and return fitted values and R² score
        """
        if len(data) < 10:
            return [], 0.0
        
        # Sample data to reduce computation (every 7th day)
        step = 7
        sampled_indices = list(range(0, len(data), step))
        if len(data) - 1 not in sampled_indices:
            sampled_indices.append(len(data) - 1)
        
        sampled_data = [data[i] for i in sampled_indices]
        
        X = np.array(sampled_indices).reshape(-1, 1)
        y = np.array(sampled_data)
        
        poly_features = PolynomialFeatures(degree=degree)
        X_poly = poly_features.fit_transform(X)
        
        model = LinearRegression()
        model.fit(X_poly, y)
        
        # Calculate R² score
        r2_score = model.score(X_poly, y)
        
        # Get fitted values for all data points
        X_all = np.arange(len(data)).reshape(-1, 1)
        X_all_poly = poly_features.transform(X_all)
        fitted_values = model.predict(X_all_poly)
        fitted_values = np.maximum(fitted_values, 0)
        
        return fitted_values.tolist(), r2_score
    
    def estimate_days_to_threshold(self, data: List[int], threshold: int) -> Optional[int]:
        """
        Estimate number of days to reach a threshold based on linear trend
        Returns None if threshold already reached or trend is negative
        """
        if len(data) < 10:
            return None
        
        current_value = data[-1]
        
        if current_value >= threshold:
            return 0  # Already reached
        
        # Use last 30 days for trend calculation
        recent_data = data[-30:]
        X = np.arange(len(recent_data)).reshape(-1, 1)
        y = np.array(recent_data)
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Get daily growth rate
        daily_rate = model.coef_[0]
        
        if daily_rate <= 0:
            return None  # Negative or no growth, threshold won't be reached
        
        # Calculate days needed
        remaining = threshold - current_value
        days_needed = int(remaining / daily_rate)
        
        return max(1, days_needed) if days_needed > 0 else None
    
    def get_predictions(self, country_name: Optional[str] = None) -> Dict[str, any]:
        """
        Get predictions for global or specific country data
        """
        if country_name:
            # Country-specific predictions
            detail_data = self.get_country_detail(country_name)
            confirmed_history = detail_data['confirmed_history']
            deaths_history = detail_data['deaths_history']
            dates = detail_data['dates']
        else:
            # Global predictions
            history = self.get_time_series_history()
            confirmed_history = history['confirmed']
            deaths_history = history['deaths']
            dates = history['dates']
        
        # Linear predictions (7 days)
        confirmed_linear = self.predict_linear(confirmed_history, days=7)
        deaths_linear = self.predict_linear(deaths_history, days=7)
        
        # Polynomial trend fitting
        confirmed_poly, confirmed_r2 = self.predict_polynomial(confirmed_history, degree=2)
        deaths_poly, deaths_r2 = self.predict_polynomial(deaths_history, degree=2)
        
        # Generate future dates for predictions
        last_date = dates[-1]
        # Parse date format M/D/YY
        parts = last_date.split('/')
        month, day, year = int(parts[0]), int(parts[1]), int('20' + parts[2])
        last_datetime = datetime(year, month, day)
        
        future_dates = []
        for i in range(1, 8):
            future_date = last_datetime + timedelta(days=i)
            future_dates.append(future_date.strftime('%-m/%-d/%y'))
        
        # Calculate growth rate (last 7 days average)
        if len(confirmed_history) >= 7:
            recent_growth = []
            for i in range(-7, -1):
                if confirmed_history[i-1] > 0:
                    growth = ((confirmed_history[i] - confirmed_history[i-1]) / confirmed_history[i-1]) * 100
                    recent_growth.append(growth)
            avg_growth_rate = np.mean(recent_growth) if recent_growth else 0
        else:
            avg_growth_rate = 0
        
        # Estimate days to reach certain thresholds (example: +10% from current)
        current_confirmed = confirmed_history[-1]
        threshold_10_percent = int(current_confirmed * 1.1)
        days_to_threshold = self.estimate_days_to_threshold(confirmed_history, threshold_10_percent)
        
        return {
            'current_value': current_confirmed,
            'current_deaths': deaths_history[-1],
            'linear_predictions': {
                'dates': future_dates,
                'confirmed': confirmed_linear,
                'deaths': deaths_linear
            },
            'polynomial_trend': {
                'confirmed': confirmed_poly,
                'deaths': deaths_poly,
                'confirmed_r2': round(confirmed_r2, 4),
                'deaths_r2': round(deaths_r2, 4)
            },
            'growth_rate': round(avg_growth_rate, 2),
            'days_to_10_percent_increase': days_to_threshold,
            'threshold_10_percent': threshold_10_percent,
            'dates': dates
        }
    
    def clear_cache(self) -> None:
        self._fetch_dataset.cache_clear()
        
        for cache_file in self.CACHE_DIR.glob("*_cache.json"):
            cache_file.unlink()
        
        logger.info("Cache cleared successfully")


_data_provider_instance = None

def get_data_provider() -> CovidDataProvider:
    global _data_provider_instance
    if _data_provider_instance is None:
        _data_provider_instance = CovidDataProvider()
    return _data_provider_instance
