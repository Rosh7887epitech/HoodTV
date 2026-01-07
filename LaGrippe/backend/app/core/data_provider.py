

import pandas as pd
import json
import os
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging

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
