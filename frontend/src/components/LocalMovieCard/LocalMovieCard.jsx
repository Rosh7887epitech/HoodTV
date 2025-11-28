import { useState } from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import './LocalMovieCard.css';

export default function LocalMovieCard({ movie, onDelete }) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatSize = (sizeMB) => {
    if (sizeMB >= 1024) {
      return `${(sizeMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeMB} MB`;
  };

  const handlePlay = () => {
    // Si c'est un film local (avec path), ouvrir le player
    if (movie.path) {
      setShowPlayer(true);
    }
    // Sinon ne rien faire (pour les films favoris sans fichier local)
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(movie.id);
    }
  };

  // Support pour les films locaux ET les films favoris de la DB
  const displayTitle = movie.tmdb_title || movie.title;
  const displayYear = movie.tmdb_year || movie.year;
  const posterUrl = movie.tmdb_poster || movie.poster_url;

  const favoriteMetadata = {
    poster_url: posterUrl,
    year: displayYear,
    size_mb: movie.size_mb,
    extension: movie.extension,
    path: movie.path
  };

  return (
    <>
      <div className="local-movie-card" onClick={handlePlay}>
        <div className="movie-poster-container">
          {posterUrl && !imageError ? (
            <img 
              src={posterUrl} 
              alt={displayTitle}
              className="movie-poster"
              onError={handleImageError}
            />
          ) : (
            <div className="movie-poster-placeholder">
              <span className="placeholder-icon">🎬</span>
              <span className="placeholder-text">Pas d'affiche</span>
            </div>
          )}
          <div className="movie-favorite-btn">
            <FavoriteButton
              contentType="movie_local"
              title={displayTitle}
              metadata={favoriteMetadata}
            />
          </div>
          {movie.path && (
            <div className="movie-overlay">
              <button className="play-button-overlay">
                <span className="play-icon">▶</span>
                <span>Lire</span>
              </button>
            </div>
          )}
          {onDelete && (
            <button className="delete-button-overlay" onClick={handleDelete}>
              <span>✕</span>
            </button>
          )}
        </div>
        
        <div className="movie-card-info">
          <h3 className="movie-card-title" title={displayTitle}>
            {displayTitle}
          </h3>
          {displayYear && (
            <p className="movie-year">{displayYear}</p>
          )}
          {movie.extension && movie.size_mb && (
            <div className="movie-metadata">
              <span className="file-extension">{movie.extension.replace('.', '').toUpperCase()}</span>
              <span className="file-size">{formatSize(movie.size_mb)}</span>
            </div>
          )}
        </div>
      </div>

      {showPlayer && movie.path && (
        <VideoPlayer 
          movie={movie} 
          onClose={handleClosePlayer}
        />
      )}
    </>
  );
}