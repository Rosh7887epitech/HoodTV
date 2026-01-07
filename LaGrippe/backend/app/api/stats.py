"""
COVID-19 Statistics API Endpoints

Provides REST API for COVID-19 data visualization dashboard.
"""

from fastapi import APIRouter, HTTPException, status, Query
from datetime import datetime
from typing import Dict, List
import logging

from app.models.schemas import (
    GlobalStats,
    MapResponse,
    HistoryResponse,
    LocationData,
    ErrorResponse
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
    """
    Retrieve global COVID-19 statistics.
    
    This endpoint aggregates data from all countries and regions to provide
    worldwide totals for all COVID-19 metrics.
    """
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
    """
    Retrieve data for interactive map visualization.
    
    Returns a list of all geographic locations with their coordinates and
    COVID-19 case counts for the specified date (confirmed, deaths, recovered, active).
    Ideal for plotting on interactive maps like Leaflet.
    
    Args:
        date: Optional date string (e.g., '3/15/23'). If not provided, uses latest available date.
    """
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
    """
    Retrieve all available dates from the COVID-19 dataset.
    
    Returns a list of date strings in chronological order, which can be used
    to filter map data by specific dates.
    """
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
    """
    Retrieve historical time series data for trend visualization.
    
    Returns arrays of daily totals for all COVID-19 metrics, enabling
    the creation of line charts and trend analysis graphs.
    Data starts from January 22, 2020 (first recorded date).
    """
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
    """
    Retrieve COVID-19 statistics for a specific country.
    
    Args:
        country_name: Name of the country (e.g., 'France', 'US', 'Germany')
    
    Returns:
        Dictionary with time series data for the specified country
    """
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
    """
    Clear all cached COVID-19 data.
    
    Forces the system to fetch fresh data from GitHub on the next API call.
    Useful for testing or when immediate data updates are required.
    """
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
