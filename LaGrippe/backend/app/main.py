"""
COVID-19 DataViz Backend - FastAPI Application

Main application entry point with CORS configuration and route registration.
Epitech Project - Professional Implementation
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

from app.api import stats
from app.models.schemas import HealthCheckResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="COVID-19 DataViz API",
    description="""
    Professional COVID-19 Data Visualization Backend API
    
    ## Epitech Project - ProPro
    
    This API provides real-time COVID-19 statistics from Johns Hopkins University CSSE dataset.
    
    ### Features:
    - **Global Statistics**: Worldwide totals for cases, deaths, and recoveries
    - **Map Data**: Geographic coordinates and case counts for interactive mapping
    - **Historical Trends**: Daily time series data since January 2020
    - **Smart Caching**: 6-hour cache with automatic refresh
    - **Always Updated**: Direct fetch from GitHub repository (no cloning required)
    
    ### Technical Stack:
    - FastAPI (Python 3.11+)
    - Pandas for data processing
    - Pydantic for validation
    - Two-layer caching (Memory + Disk)
    
    ### Data Source:
    Johns Hopkins CSSE COVID-19 Dataset
    https://github.com/CSSEGISandData/COVID-19
    """,
    version="1.0.0",
    contact={
        "name": "Epitech Student",
        "email": "student@epitech.eu"
    },
    license_info={
        "name": "MIT License"
    }
)

# CORS Configuration - Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Register API routes
app.include_router(stats.router, prefix="/api")


@app.get(
    "/",
    response_model=HealthCheckResponse,
    summary="API Health Check",
    tags=["System"]
)
async def root() -> HealthCheckResponse:
    """
    Root endpoint - API health check.
    
    Returns the current status and version of the API.
    """
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        cache_status="active"
    )


@app.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Detailed Health Check",
    tags=["System"]
)
async def health_check() -> HealthCheckResponse:
    """
    Detailed health check endpoint.
    
    Verifies that the API and all its dependencies are functioning correctly.
    """
    try:
        from app.core.data_provider import get_data_provider
        provider = get_data_provider()
        
        return HealthCheckResponse(
            status="healthy",
            version="1.0.0",
            timestamp=datetime.now().isoformat(),
            cache_status="operational"
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="degraded",
            version="1.0.0",
            timestamp=datetime.now().isoformat(),
            cache_status="error"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.
    
    Ensures all errors are logged and returned in a consistent format.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


@app.on_event("startup")
async def startup_event():
    """
    Application startup event handler.
    
    Initializes the data provider and performs any necessary setup.
    """
    logger.info("COVID-19 DataViz API starting up...")
    logger.info("Data source: Johns Hopkins CSSE GitHub Repository")
    logger.info("Cache duration: 6 hours")
    logger.info("API ready to serve requests")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event handler.
    
    Performs cleanup operations before the application stops.
    """
    logger.info("COVID-19 DataViz API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Hot reload for development
        log_level="info"
    )
