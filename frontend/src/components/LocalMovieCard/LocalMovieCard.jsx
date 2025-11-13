import { useState } from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import './LocalMovieCard.css';

export default function LocalMovieCard({ movie }) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatSize = (sizeMB) => {
    if (sizeMB >= 1024) {
      return `${(sizeMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeMB} MB`;
  };

  const handlePlay = () => {
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const displayTitle = movie.tmdb_title || movie.title;
  const displayYear = movie.tmdb_year;

  return (
    <>
      <div className="local-movie-card" onClick={handlePlay}>
        <div className="movie-poster-container">
          {movie.tmdb_poster && !imageError ? (
            <img 
              src={movie.tmdb_poster} 
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
          <div className="movie-overlay">
            <button className="play-button-overlay">
              <span className="play-icon"></span>
              <span>Lire</span>
            </button>
          </div>
        </div>
        
        <div className="movie-card-info">
          <h3 className="movie-card-title" title={displayTitle}>
            {displayTitle}
          </h3>
          {displayYear && (
            <p className="movie-year">{displayYear}</p>
          )}
          <div className="movie-metadata">
            <span className="file-extension">{movie.extension.replace('.', '').toUpperCase()}</span>
            <span className="file-size">{formatSize(movie.size_mb)}</span>
          </div>
        </div>
      </div>

      {showPlayer && (
        <VideoPlayer 
          movie={movie} 
          onClose={handleClosePlayer}
        />
      )}
    </>
  );
}