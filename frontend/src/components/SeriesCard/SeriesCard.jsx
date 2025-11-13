import { useState } from 'react';
import "./SeriesCard.css";

export default function SeriesCard({ series, onClick }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Utiliser le nom TMDB si disponible, sinon le nom du dossier
  const displayName = series.tmdb_name || series.name;
  const displayYear = series.tmdb_year;

  const formatSize = (sizeMB) => {
    if (sizeMB >= 1024) {
      return `${(sizeMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeMB} MB`;
  };

  return (
    <div className="series-card" onClick={() => onClick(series)}>
      <div className="series-poster-container">
        {series.tmdb_poster && !imageError ? (
          <img 
            src={series.tmdb_poster} 
            alt={displayName}
            className="series-poster"
            onError={handleImageError}
          />
        ) : (
          <div className="series-poster-placeholder">
            <span className="placeholder-icon">📺</span>
            <span className="placeholder-text">Pas d'affiche</span>
          </div>
        )}
        <div className="series-overlay">
          <button className="view-button-overlay">
            <span className="view-icon">👁️</span>
            <span>Voir les épisodes</span>
          </button>
        </div>
      </div>
      
      <div className="series-card-info">
        <h3 className="series-card-title" title={displayName}>
          {displayName}
        </h3>
        {displayYear && (
          <p className="series-year">{displayYear}</p>
        )}
        <div className="series-metadata">
          <span className="episode-count">
            {series.episode_count} épisode{series.episode_count !== 1 ? 's' : ''}
          </span>
          <span className="series-size">{formatSize(series.total_size_mb)}</span>
        </div>
      </div>
    </div>
  );
}