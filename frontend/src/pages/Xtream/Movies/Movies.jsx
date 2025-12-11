import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import xtreamService from '../../../services/xtreamService';
import { 
  filterByName, 
  filterByCategory, 
  sortByName, 
  sortByDate, 
  getImageUrl,
  formatDuration,
  getExtension 
} from '../../../services/xtreamUtils';
import BackButton from '../../../components/BackButton/BackButton';
import VideoPlayer from '../../../components/VideoPlayer/VideoPlayer';
import './Movies.css';

export default function Movies() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentMovie, setCurrentMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movies, searchTerm, selectedCategory, sortBy]);

  const loadData = async () => {
    const currentAccount = xtreamService.getCurrentAccount();
    
    if (!currentAccount) {
      setError('Aucun compte actif. Veuillez configurer un compte Xtream.');
      navigate('/xtream/add-account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [moviesData, categoriesData] = await Promise.all([
        xtreamService.getVodStreams(),
        xtreamService.getVodCategories()
      ]);

      setMovies(moviesData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des films');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movies];
    
    // Filtre par recherche
    filtered = filterByName(filtered, searchTerm);
    
    // Filtre par catégorie
    filtered = filterByCategory(filtered, selectedCategory);
    
    // Tri
    if (sortBy === 'name') {
      filtered = sortByName(filtered, 'asc');
    } else if (sortBy === 'date') {
      filtered = sortByDate(filtered, 'desc');
    }
    
    setFilteredMovies(filtered);
  };

  const handlePlayMovie = async (movie) => {
    try {
      // Charger les détails du film pour avoir toutes les infos
      const details = await xtreamService.getVodInfo(movie.stream_id);
      
      const extension = getExtension(movie.container_extension);
      const streamUrl = xtreamService.getVodUrl(movie.stream_id, extension);
      
      setMovieDetails(details);
      setCurrentMovie({
        name: movie.name,
        path: streamUrl, // URL directe Xtream
        poster: movie.stream_icon || movie.cover,
        info: details?.info || {},
        direct: true // Flag pour utiliser l'URL directe sans proxy
      });
    } catch (err) {
      alert(`Erreur lors du chargement du film: ${err.message}`);
    }
  };

  const handleClosePlayer = () => {
    setCurrentMovie(null);
    setMovieDetails(null);
  };

  if (loading) {
    return (
      <div className="movies-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des films...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movies-page">
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
    <div className="movies-page">
      <div className="movies-header">
        <div>
          <h1 className="page-title">Films</h1>
          <p className="page-subtitle">
            {filteredMovies.length} film{filteredMovies.length > 1 ? 's' : ''} disponible{filteredMovies.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Rechercher un film..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter">
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-filter">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Nom (A-Z)</option>
            <option value="date">Date d'ajout</option>
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="empty-result">
          <p className="empty-icon">🔍</p>
          <p className="empty-text">Aucun film trouvé</p>
        </div>
      ) : (
        <div className="movies-grid">
          {filteredMovies.map(movie => (
            <div
              key={movie.stream_id}
              className="movie-card"
              onClick={() => handlePlayMovie(movie)}
            >
              <div className="movie-poster-wrapper">
                <img
                  src={getImageUrl(movie.stream_icon || movie.cover, movie.name)}
                  alt={movie.name}
                  className="movie-poster"
                  onError={(e) => {
                    e.target.src = getImageUrl('', movie.name);
                  }}
                />
                <div className="movie-overlay">
                  <span className="play-icon">▶</span>
                </div>
                {movie.rating && parseFloat(movie.rating) > 0 && (
                  <div className="movie-rating">
                    ⭐ {parseFloat(movie.rating).toFixed(1)}
                  </div>
                )}
              </div>
              
              <div className="movie-info">
                <h3 className="movie-title">{movie.name}</h3>
                <div className="movie-meta">
                  {movie.added && (
                    <span className="meta-item">{new Date(movie.added * 1000).getFullYear()}</span>
                  )}
                  {movie.duration && (
                    <span className="meta-item">{formatDuration(movie.duration)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player Modal */}
      {currentMovie && (
        <div className="player-modal">
          <div className="player-modal-overlay" onClick={handleClosePlayer}></div>
          <div className="player-modal-content">
            
            {movieDetails?.info && (
              <div className="movie-details-panel">
                <h2 className="details-title">{currentMovie.name}</h2>
                {movieDetails.info.plot && (
                  <p className="details-plot">{movieDetails.info.plot}</p>
                )}
                <div className="details-meta">
                  {movieDetails.info.director && (
                    <span className="meta-tag">{movieDetails.info.director}</span>
                  )}
                  {movieDetails.info.genre && (
                    <span className="meta-tag">{movieDetails.info.genre}</span>
                  )}
                  {movieDetails.info.releasedate && (
                    <span className="meta-tag">{movieDetails.info.releasedate}</span>
                  )}
                  {movieDetails.info.rating && (
                    <span className="meta-tag">⭐ {movieDetails.info.rating}</span>
                  )}
                </div>
              </div>
            )}
            
            <VideoPlayer
              movie={currentMovie}
              onClose={handleClosePlayer}
            />
          </div>
        </div>
      )}
    </div>
  );
}
