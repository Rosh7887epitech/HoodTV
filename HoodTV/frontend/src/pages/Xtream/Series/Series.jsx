import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import xtreamService from '../../../services/xtreamService';
import { 
  filterByName, 
  sortByName, 
  getImageUrl 
} from '../../../services/xtreamUtils';
import BackButton from '../../../components/BackButton/BackButton';
import './Series.css';

export default function Series() {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Définir l'utilisateur courant
    const userId = localStorage.getItem('userId');
    if (userId) {
      xtreamService.setCurrentUser(parseInt(userId));
    }
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [series, searchTerm]);

  const loadData = async () => {
    const currentAccount = await xtreamService.getCurrentAccount();
    
    if (!currentAccount) {
      setError('Aucun compte actif. Veuillez configurer un compte Xtream.');
      navigate('/xtream/add-account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const categoriesData = await xtreamService.getSeriesCategories();
      setCategories(categoriesData || []);
      
      if (categoriesData && categoriesData.length > 0) {
        const firstCategoryId = categoriesData[0].category_id;
        setSelectedCategory(firstCategoryId);
        
        const seriesData = await xtreamService.getSeriesByCategory(firstCategoryId);
        setSeries(seriesData || []);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des séries');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...series];
    
    filtered = filterByName(filtered, searchTerm);
    filtered = sortByName(filtered, 'asc');
    setFilteredSeries(filtered);
  };

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    setSearchTerm('');
    
    try {
      if (categoryId === 'all') {
        const seriesData = await xtreamService.getSeries();
        setSeries(seriesData || []);
      } else {
        const seriesData = await xtreamService.getSeriesByCategory(categoryId);
        setSeries(seriesData || []);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des séries');
    } finally {
      setLoading(false);
    }
  };

  const handleSeriesClick = (seriesItem) => {
    navigate(`/xtream/series/${seriesItem.series_id}`, {
      state: { series: seriesItem }
    });
  };

  if (loading) {
    return (
      <div className="series-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des séries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="series-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Erreur</h2>
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={loadData}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="series-page">
      <div className="series-header">
        <div>
          <h1 className="page-title">Séries</h1>
          <p className="page-subtitle">
            {filteredSeries.length} série{filteredSeries.length > 1 ? 's' : ''} disponible{filteredSeries.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Rechercher une série..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter">
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredSeries.length === 0 ? (
        <div className="empty-result">
          <p className="empty-icon">🔍</p>
          <p className="empty-text">Aucune série trouvée</p>
        </div>
      ) : (
        <div className="series-grid">
          {filteredSeries.map(seriesItem => (
            <div
              key={seriesItem.series_id}
              className="series-card"
              onClick={() => handleSeriesClick(seriesItem)}
            >
              <div className="series-poster-wrapper">
                <img
                  src={getImageUrl(seriesItem.cover, seriesItem.name)}
                  alt={seriesItem.name}
                  className="series-poster"
                  onError={(e) => {
                    e.target.src = getImageUrl('', seriesItem.name);
                  }}
                />
                <div className="series-overlay">
                  <span className="view-icon">👁️</span>
                  <span className="view-text">Voir les épisodes</span>
                </div>
                {seriesItem.rating && parseFloat(seriesItem.rating) > 0 && (
                  <div className="series-rating">
                    ⭐ {parseFloat(seriesItem.rating).toFixed(1)}
                  </div>
                )}
              </div>
              
              <div className="series-info">
                <h3 className="series-title">{seriesItem.name}</h3>
                {seriesItem.releaseDate && (
                  <p className="series-year">{seriesItem.releaseDate}</p>
                )}
                {seriesItem.last_modified && (
                  <p className="series-updated">
                    Mis à jour: {new Date(seriesItem.last_modified * 1000).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
