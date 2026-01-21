

from fastapi import APIRouter, HTTPException, status, Query
from datetime import datetime
from typing import Dict, List
import logging

from app.models.schemas import (
    GlobalStats,
    MapResponse,
    HistoryResponse,
    LocationData,
    ErrorResponse,
    CountryComparisonResponse,
    CountryTimeSeriesData,
    CountryListItem,
    CountryDetailStats,
    PredictionResponse,
    LinearPredictions,
    PolynomialTrend
)
from app.core.data_provider import get_data_provider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get(
    "/global",
    response_model=GlobalStats,
    summary="Get Global COVID-19 Statistics",
    description="Returns current global totals for confirmed cases, deaths, recovered, and active cases.",
    responses={
        200: {"model": GlobalStats},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_global_stats() -> GlobalStats:
    try:
        provider = get_data_provider()
        totals = provider.get_global_totals()
        
        return GlobalStats(
            confirmed=totals.get("confirmed", 0),
            deaths=totals.get("deaths", 0),
            recovered=totals.get("recovered", 0),
            active=totals.get("active", 0),
            last_update=datetime.now().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error fetching global stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch global statistics: {str(e)}"
        )


@router.get(
    "/map",
    response_model=MapResponse,
    summary="Get Map Visualization Data",
    description="Returns geographic coordinates and case counts for all locations worldwide for a specific date or latest date.",
    responses={
        200: {"model": MapResponse},
        400: {"model": ErrorResponse, "description": "Invalid date parameter"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_map_data(
    date: str = Query(None, description="Date to retrieve data for (e.g., '3/15/23'). If not provided, latest date is used.")
) -> MapResponse:
    try:
        provider = get_data_provider()
        map_data = provider.get_map_data(date=date)
        
        locations = [LocationData(**location) for location in map_data]
        
        return MapResponse(
            locations=locations,
            total_locations=len(locations),
            last_update=datetime.now().isoformat()
        )
    
    except ValueError as e:
        logger.error(f"Invalid date parameter: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error fetching map data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch map data: {str(e)}"
        )


@router.get(
    "/available-dates",
    response_model=List[str],
    summary="Get Available Dates",
    description="Returns all available dates in the dataset for filtering map data.",
    responses={
        200: {"description": "List of available dates"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_available_dates() -> List[str]:
    try:
        provider = get_data_provider()
        dates = provider.get_available_dates()
        return dates
    
    except Exception as e:
        logger.error(f"Error fetching available dates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch available dates: {str(e)}"
        )


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get Historical Time Series Data",
    description="Returns daily time series data for global COVID-19 trends since the beginning of the pandemic.",
    responses={
        200: {"model": HistoryResponse},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_history_data() -> HistoryResponse:
    try:
        provider = get_data_provider()
        history = provider.get_time_series_history()
        
        return HistoryResponse(
            dates=history["dates"],
            confirmed=history["confirmed"],
            deaths=history["deaths"],
            recovered=history["recovered"],
            active=history["active"],
            total_days=len(history["dates"]),
            last_update=datetime.now().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error fetching history data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch historical data: {str(e)}"
        )


@router.get(
    "/country/{country_name}",
    summary="Get Country-Specific Data",
    description="Returns COVID-19 statistics for a specific country.",
    responses={
        200: {"description": "Country data retrieved successfully"},
        404: {"model": ErrorResponse, "description": "Country not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_country_stats(country_name: str) -> Dict:
    try:
        provider = get_data_provider()
        country_data = provider.get_country_data(country_name)
        
        if not country_data or all(df.empty for df in country_data.values()):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Country '{country_name}' not found in dataset"
            )
        
        # Convert DataFrames to JSON-serializable format
        result = {}
        for metric, df in country_data.items():
            if not df.empty:
                result[metric] = df.to_dict(orient='records')
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching country data for {country_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch data for country '{country_name}': {str(e)}"
        )


@router.post(
    "/cache/clear",
    summary="Clear Data Cache",
    description="Clears both memory and disk cache, forcing fresh data fetch on next request.",
    responses={
        200: {"description": "Cache cleared successfully"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def clear_cache() -> Dict[str, str]:
    try:
        provider = get_data_provider()
        provider.clear_cache()
        
        return {
            "status": "success",
            "message": "Cache cleared successfully",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get(
    "/countries",
    response_model=List[CountryListItem],
    summary="Get List of All Countries",
    description="Returns a list of all available countries with their latest totals, sorted by confirmed cases.",
    responses={
        200: {"model": List[CountryListItem]},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_countries_list() -> List[CountryListItem]:
    try:
        provider = get_data_provider()
        countries = provider.get_available_countries()
        
        return [CountryListItem(**country) for country in countries]
    
    except Exception as e:
        logger.error(f"Error fetching countries list: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch countries list: {str(e)}"
        )


@router.get(
    "/compare",
    response_model=CountryComparisonResponse,
    summary="Compare Multiple Countries",
    description="Returns time series comparison data for specified countries, enabling side-by-side analysis.",
    responses={
        200: {"model": CountryComparisonResponse},
        400: {"model": ErrorResponse, "description": "Invalid country names or empty list"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def compare_countries(
    countries: List[str] = Query(..., description="List of country names to compare (e.g., ['France', 'US', 'Germany'])")
) -> CountryComparisonResponse:
    try:
        if not countries or len(countries) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one country must be specified"
            )
        
        if len(countries) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 countries can be compared at once"
            )
        
        provider = get_data_provider()
        comparison = provider.get_countries_comparison(countries)
        
        countries_data = [
            CountryTimeSeriesData(**country_data)
            for country_data in comparison['countries']
        ]
        
        return CountryComparisonResponse(
            countries=countries_data,
            dates=comparison['dates'],
            last_update=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing countries: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare countries: {str(e)}"
        )


@router.get(
    "/country-detail/{country_name}",
    response_model=CountryDetailStats,
    summary="Get Detailed Country Statistics",
    description="Returns comprehensive statistics for a specific country including time series, daily changes, and geographic locations.",
    responses={
        200: {"model": CountryDetailStats},
        404: {"model": ErrorResponse, "description": "Country not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_country_detail(country_name: str) -> CountryDetailStats:
    try:
        provider = get_data_provider()
        detail_data = provider.get_country_detail(country_name)
        
        # Check if country exists
        if detail_data['total_confirmed'] == 0 and detail_data['total_deaths'] == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Country '{country_name}' not found or has no data"
            )
        
        locations = [LocationData(**loc) for loc in detail_data['locations']]
        
        return CountryDetailStats(
            name=detail_data['name'],
            total_confirmed=detail_data['total_confirmed'],
            total_deaths=detail_data['total_deaths'],
            total_recovered=detail_data['total_recovered'],
            total_active=detail_data['total_active'],
            mortality_rate=detail_data['mortality_rate'],
            recovery_rate=detail_data['recovery_rate'],
            dates=detail_data['dates'],
            confirmed_history=detail_data['confirmed_history'],
            deaths_history=detail_data['deaths_history'],
            recovered_history=detail_data['recovered_history'],
            active_history=detail_data['active_history'],
            daily_new_cases=detail_data['daily_new_cases'],
            daily_new_deaths=detail_data['daily_new_deaths'],
            locations=locations,
            peak_date=detail_data['peak_date'],
            peak_value=detail_data['peak_value'],
            last_update=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching country detail for {country_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch country detail: {str(e)}"
        )


@router.get(
    "/predictions",
    response_model=PredictionResponse,
    summary="Get Global Predictions and Trends",
    description="Returns predictions and trend analysis for global COVID-19 data using linear regression and polynomial fitting.",
    responses={
        200: {"model": PredictionResponse},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_predictions() -> PredictionResponse:
    try:
        provider = get_data_provider()
        predictions = provider.get_predictions()
        
        return PredictionResponse(
            current_value=predictions['current_value'],
            current_deaths=predictions['current_deaths'],
            linear_predictions=LinearPredictions(**predictions['linear_predictions']),
            polynomial_trend=PolynomialTrend(**predictions['polynomial_trend']),
            growth_rate=predictions['growth_rate'],
            days_to_10_percent_increase=predictions['days_to_10_percent_increase'],
            threshold_10_percent=predictions['threshold_10_percent'],
            dates=predictions['dates'],
            last_update=datetime.now().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate predictions: {str(e)}"
        )


@router.get(
    "/predictions/{country_name}",
    response_model=PredictionResponse,
    summary="Get Country-Specific Predictions and Trends",
    description="Returns predictions and trend analysis for a specific country's COVID-19 data.",
    responses={
        200: {"model": PredictionResponse},
        404: {"model": ErrorResponse, "description": "Country not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_country_predictions(country_name: str) -> PredictionResponse:
    try:
        provider = get_data_provider()
        predictions = provider.get_predictions(country_name=country_name)
        
        return PredictionResponse(
            current_value=predictions['current_value'],
            current_deaths=predictions['current_deaths'],
            linear_predictions=LinearPredictions(**predictions['linear_predictions']),
            polynomial_trend=PolynomialTrend(**predictions['polynomial_trend']),
            growth_rate=predictions['growth_rate'],
            days_to_10_percent_increase=predictions['days_to_10_percent_increase'],
            threshold_10_percent=predictions['threshold_10_percent'],
            dates=predictions['dates'],
            last_update=datetime.now().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error generating predictions for {country_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate predictions for {country_name}: {str(e)}"
        )
