from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class GlobalStats(BaseModel):
    confirmed: int = Field(..., description="Total confirmed cases worldwide")
    deaths: int = Field(..., description="Total deaths worldwide")
    recovered: int = Field(..., description="Total recovered cases worldwide")
    active: int = Field(..., description="Currently active cases (confirmed - deaths - recovered)")
    last_update: str = Field(..., description="Last data update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "confirmed": 700000000,
                "deaths": 7000000,
                "recovered": 670000000,
                "active": 23000000,
                "last_update": "2024-01-07T12:00:00"
            }
        }


class LocationData(BaseModel):
    province: str = Field(..., description="Province or state name")
    country: str = Field(..., description="Country or region name")
    lat: float = Field(..., description="Latitude coordinate")
    long: float = Field(..., description="Longitude coordinate")
    confirmed: int = Field(..., description="Confirmed cases at this location")
    deaths: int = Field(..., description="Deaths at this location")
    recovered: int = Field(..., description="Recovered cases at this location")
    active: int = Field(..., description="Active cases at this location")
    
    class Config:
        json_schema_extra = {
            "example": {
                "province": "Île-de-France",
                "country": "France",
                "lat": 48.8566,
                "long": 2.3522,
                "confirmed": 1500000,
                "deaths": 25000,
                "recovered": 1450000,
                "active": 25000
            }
        }


class MapResponse(BaseModel):
    locations: List[LocationData] = Field(..., description="List of all locations with COVID-19 data")
    total_locations: int = Field(..., description="Total number of locations")
    last_update: str = Field(..., description="Last data update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "locations": [],
                "total_locations": 3800,
                "last_update": "2024-01-07T12:00:00"
            }
        }


class TimeSeriesPoint(BaseModel):
    date: str = Field(..., description="Date in format MM/DD/YY")
    confirmed: int = Field(..., description="Total confirmed cases on this date")
    deaths: int = Field(..., description="Total deaths on this date")
    recovered: int = Field(..., description="Total recovered cases on this date")
    active: int = Field(..., description="Active cases on this date")


class HistoryResponse(BaseModel):
    dates: List[str] = Field(..., description="List of dates (MM/DD/YY format)")
    confirmed: List[int] = Field(..., description="Confirmed cases over time")
    deaths: List[int] = Field(..., description="Deaths over time")
    recovered: List[int] = Field(..., description="Recovered cases over time")
    active: List[int] = Field(..., description="Active cases over time")
    total_days: int = Field(..., description="Number of days in the dataset")
    last_update: str = Field(..., description="Last data update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dates": ["1/22/20", "1/23/20", "1/24/20"],
                "confirmed": [555, 653, 941],
                "deaths": [17, 18, 26],
                "recovered": [28, 30, 36],
                "active": [510, 605, 879],
                "total_days": 1400,
                "last_update": "2024-01-07T12:00:00"
            }
        }


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="API status")
    version: str = Field(..., description="API version")
    timestamp: str = Field(..., description="Current server timestamp")
    cache_status: str = Field(..., description="Data cache status")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: str = Field(..., description="Error timestamp")


class CountryTimeSeriesData(BaseModel):
    country: str = Field(..., description="Country name")
    dates: List[str] = Field(..., description="List of dates")
    confirmed: List[int] = Field(..., description="Confirmed cases over time")
    deaths: List[int] = Field(..., description="Deaths over time")
    recovered: List[int] = Field(..., description="Recovered cases over time")
    active: List[int] = Field(..., description="Active cases over time")
    
    class Config:
        json_schema_extra = {
            "example": {
                "country": "France",
                "dates": ["1/22/20", "1/23/20", "1/24/20"],
                "confirmed": [0, 0, 2],
                "deaths": [0, 0, 0],
                "recovered": [0, 0, 0],
                "active": [0, 0, 2]
            }
        }


class CountryComparisonResponse(BaseModel):
    countries: List[CountryTimeSeriesData] = Field(..., description="Time series data for each country")
    dates: List[str] = Field(..., description="Common dates across all countries")
    last_update: str = Field(..., description="Last data update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "countries": [],
                "dates": ["1/22/20", "1/23/20"],
                "last_update": "2024-01-07T12:00:00"
            }
        }


class CountryListItem(BaseModel):
    name: str = Field(..., description="Country name")
    total_confirmed: int = Field(..., description="Total confirmed cases")
    total_deaths: int = Field(..., description="Total deaths")
    total_recovered: int = Field(..., description="Total recovered cases")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "France",
                "total_confirmed": 40000000,
                "total_deaths": 165000,
                "total_recovered": 39000000
            }
        }


class LinearPredictions(BaseModel):
    dates: List[str] = Field(..., description="Future dates for predictions")
    confirmed: List[float] = Field(..., description="Predicted confirmed cases")
    deaths: List[float] = Field(..., description="Predicted deaths")


class PolynomialTrend(BaseModel):
    confirmed: List[float] = Field(..., description="Polynomial fitted values for confirmed cases")
    deaths: List[float] = Field(..., description="Polynomial fitted values for deaths")
    confirmed_r2: float = Field(..., description="R² score for confirmed cases fit")
    deaths_r2: float = Field(..., description="R² score for deaths fit")


class PredictionResponse(BaseModel):
    current_value: int = Field(..., description="Current confirmed cases")
    current_deaths: int = Field(..., description="Current deaths")
    linear_predictions: LinearPredictions = Field(..., description="7-day linear predictions")
    polynomial_trend: PolynomialTrend = Field(..., description="Polynomial trend fitting")
    growth_rate: float = Field(..., description="Average growth rate (last 7 days)")
    days_to_10_percent_increase: Optional[int] = Field(None, description="Estimated days to reach 10% increase")
    threshold_10_percent: int = Field(..., description="Target value for 10% increase")
    dates: List[str] = Field(..., description="Historical dates")
    last_update: str = Field(..., description="Last update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_value": 700000000,
                "current_deaths": 7000000,
                "linear_predictions": {
                    "dates": ["3/24/23", "3/25/23"],
                    "confirmed": [700100000, 700200000],
                    "deaths": [7001000, 7002000]
                },
                "polynomial_trend": {
                    "confirmed": [],
                    "deaths": [],
                    "confirmed_r2": 0.98,
                    "deaths_r2": 0.97
                },
                "growth_rate": 0.05,
                "days_to_10_percent_increase": 145,
                "threshold_10_percent": 770000000,
                "dates": [],
                "last_update": "2024-01-07T12:00:00"
            }
        }


class CountryDetailStats(BaseModel):
    name: str = Field(..., description="Country name")
    total_confirmed: int = Field(..., description="Total confirmed cases")
    total_deaths: int = Field(..., description="Total deaths")
    total_recovered: int = Field(..., description="Total recovered cases")
    total_active: int = Field(..., description="Total active cases")
    mortality_rate: float = Field(..., description="Mortality rate percentage")
    recovery_rate: float = Field(..., description="Recovery rate percentage")
    dates: List[str] = Field(..., description="Available dates for time series")
    confirmed_history: List[int] = Field(..., description="Confirmed cases over time")
    deaths_history: List[int] = Field(..., description="Deaths over time")
    recovered_history: List[int] = Field(..., description="Recovered cases over time")
    active_history: List[int] = Field(..., description="Active cases over time")
    daily_new_cases: List[int] = Field(..., description="Daily new confirmed cases")
    daily_new_deaths: List[int] = Field(..., description="Daily new deaths")
    locations: List[LocationData] = Field(..., description="Geographic locations within the country")
    peak_date: str = Field(..., description="Date of peak confirmed cases")
    peak_value: int = Field(..., description="Peak confirmed cases value")
    last_update: str = Field(..., description="Last update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "France",
                "total_confirmed": 40000000,
                "total_deaths": 165000,
                "total_recovered": 39000000,
                "total_active": 835000,
                "mortality_rate": 0.41,
                "recovery_rate": 97.5,
                "dates": ["1/22/20", "1/23/20"],
                "confirmed_history": [0, 0],
                "deaths_history": [0, 0],
                "recovered_history": [0, 0],
                "active_history": [0, 0],
                "daily_new_cases": [0, 0],
                "daily_new_deaths": [0, 0],
                "locations": [],
                "peak_date": "3/23/23",
                "peak_value": 150000,
                "last_update": "2024-01-07T12:00:00"
            }
        }
