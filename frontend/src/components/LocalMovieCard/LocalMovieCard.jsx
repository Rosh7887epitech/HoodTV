import { useState } from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';

export default function LocalMovieCard({ movie }) {
  const [showPlayer, setShowPlayer] = useState(false);

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

  return (
    <>
      <div className="local-movie-card">
        <div className="movie-icon">🎬</div>
        <div className="movie-info">
          <h3>{movie.title}</h3>
          <p className="movie-details">
            <span className="file-extension">{movie.extension.toUpperCase()}</span>
            <span className="file-size">{formatSize(movie.size_mb)}</span>
          </p>
          {movie.folder !== '.' && (
            <p className="movie-folder">📁 {movie.folder}</p>
          )}
          <button className="play-button" onClick={handlePlay}>
            ▶️ Lire
          </button>
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