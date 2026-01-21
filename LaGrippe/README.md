# COVID-19 DataViz Dashboard

A comprehensive, real-time COVID-19 data visualization platform built as an Epitech ProPro project. This full-stack application provides interactive maps, historical trends, country comparisons, and predictive analytics for global COVID-19 statistics.

## 🌟 Features

### Core Functionality
- **Real-time Global Statistics**: Live worldwide totals for confirmed cases, deaths, recoveries, and active cases
- **Interactive World Map**: Geographic visualization with clickable markers showing case counts by location
- **Historical Time Series**: Daily trend data since January 2020 with interactive charts
- **Country-Specific Analysis**: Detailed statistics and trends for individual countries
- **Multi-Country Comparison**: Side-by-side analysis of up to 10 countries simultaneously
- **Predictive Analytics**: Linear regression and polynomial trend analysis for forecasting

### Advanced Features
- **Smart Caching System**: 6-hour cache with automatic refresh to ensure data freshness
- **Responsive Design**: Mobile-first approach with Tailwind CSS for optimal viewing on all devices
- **Dark/Light Theme**: User-friendly interface with theme switching capability
- **Data Export**: JSON API endpoints for data integration
- **Health Monitoring**: Built-in API health checks and error handling

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI with automatic OpenAPI documentation
- **Data Processing**: Pandas for efficient data manipulation
- **Caching**: Two-layer caching (memory + disk) for optimal performance
- **Validation**: Pydantic models for robust data validation
- **CORS**: Configured for frontend integration

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS for utility-first styling
- **Charts**: Recharts for interactive data visualizations
- **Maps**: React-Leaflet with OpenStreetMap integration
- **HTTP Client**: Axios for reliable API communication

## 📊 Data Source

**Johns Hopkins University CSSE COVID-19 Dataset**
- Repository: [CSSEGISandData/COVID-19](https://github.com/CSSEGISandData/COVID-19)
- Direct GitHub integration (no local cloning required)
- Daily updates from authoritative global health sources
- Comprehensive coverage since January 22, 2020

## 🚀 Quick Start

### Prerequisites
- **Backend**: Python 3.11+
- **Frontend**: Node.js 18+ and npm/yarn
- **System**: Linux/macOS/Windows

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LaGrippe
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   - Application: http://localhost:5173

## 📡 API Endpoints

### Core Endpoints
- `GET /` - API health check
- `GET /health` - Detailed health status
- `GET /api/stats/global` - Global COVID-19 statistics
- `GET /api/stats/map` - Map visualization data
- `GET /api/stats/history` - Historical time series data
- `GET /api/stats/available-dates` - Available dates for filtering

### Country Endpoints
- `GET /api/stats/countries` - List all available countries
- `GET /api/stats/country/{country_name}` - Country-specific data
- `GET /api/stats/country-detail/{country_name}` - Detailed country statistics
- `GET /api/stats/compare?countries=France,US,Germany` - Compare multiple countries

### Analytics Endpoints
- `GET /api/stats/predictions` - Global predictions and trends
- `GET /api/stats/predictions/{country_name}` - Country-specific predictions

### System Endpoints
- `POST /api/stats/cache/clear` - Clear data cache

## 🛠️ Development

### Backend Development
```bash
cd backend
# Install development dependencies
pip install -r requirements-dev.txt  # If available

# Run tests
pytest

# Run with auto-reload
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Project Structure
```
LaGrippe/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── api/
│   │   │   └── stats.py         # Statistics endpoints
│   │   ├── core/
│   │   │   └── data_provider.py # Data fetching & caching
│   │   └── models/
│   │       └── schemas.py       # Pydantic models
│   ├── cache/                   # Cached data files
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/
│   │   │   └── api.ts           # API client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Optional: Configure CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: Configure cache duration (seconds)
CACHE_DURATION=21600  # 6 hours
```

**Frontend (.env)**
```env
# API base URL
VITE_API_BASE_URL=http://localhost:8000
```

### Cache Configuration
- **Duration**: 6 hours (configurable)
- **Storage**: Memory + Disk cache
- **Auto-refresh**: On cache expiration
- **Manual clear**: Via API endpoint

## 📈 Features in Detail

### Interactive Map
- **Technology**: React-Leaflet with OpenStreetMap
- **Data**: Geographic coordinates for all locations
- **Interaction**: Click markers for detailed information
- **Filtering**: Date-based filtering for historical views

### Data Visualizations
- **Charts**: Line charts, bar charts, area charts
- **Library**: Recharts for React
- **Metrics**: Confirmed cases, deaths, recoveries, active cases
- **Time Ranges**: Daily, weekly, monthly views

### Predictive Analytics
- **Models**: Linear regression, polynomial fitting
- **Metrics**: Growth rates, trend analysis
- **Forecasting**: Short-term predictions
- **Confidence**: Statistical confidence intervals

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/  # Assuming test directory exists
```

### Frontend Testing
```bash
cd frontend
npm test  # If configured
```

## 🚢 Deployment

### Backend Deployment
```bash
# Using Docker
docker build -t covid-backend .
docker run -p 8000:8000 covid-backend

# Using uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment
```bash
npm run build
# Serve dist/ directory with any static server
```

### Production Considerations
- Enable HTTPS
- Configure reverse proxy (nginx)
- Set up monitoring and logging
- Configure environment variables
- Set up CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript strict mode
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Johns Hopkins University** for the COVID-19 dataset
- **Epitech** for the project opportunity
- **Open Source Community** for the amazing tools and libraries

## 📞 Support

For questions or issues:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/docs`

---

**Built with ❤️ by Epitech Students**