import FavoriteButton from '../FavoriteButton/FavoriteButton';
import './LocalAudioCard.css';

export default function LocalAudioCard({ audio, onPlay }) {
  const formatFileSize = (sizeMb) => {
    if (sizeMb < 1) {
      return `${Math.round(sizeMb * 1024)} KB`;
    }
    return `${sizeMb.toFixed(1)} MB`;
  };

  const favoriteMetadata = {
    artist: audio.artist,
    album: audio.album,
    size_mb: audio.size_mb,
    extension: audio.extension,
    path: audio.path
  };

  return (
    <div className="local-audio-card">
      <div className="audio-card-header">
        <div className="audio-icon">
          🎵
        </div>
        <div className="audio-format">
          {audio.extension.toUpperCase().slice(1)}
        </div>
        <div className="audio-favorite-btn">
          <FavoriteButton
            contentType="audio_local"
            title={audio.title}
            metadata={favoriteMetadata}
          />
        </div>
      </div>
      
      <div className="audio-card-content">
        <h3 className="audio-title" title={audio.title}>
          {audio.title}
        </h3>
        
        <div className="audio-metadata">
          <p className="audio-artist">
            <span className="metadata-label">Artiste:</span>
            <span className="metadata-value">{audio.artist}</span>
          </p>
          
          <p className="audio-album">
            <span className="metadata-label">Album:</span>
            <span className="metadata-value">{audio.album}</span>
          </p>
        </div>
      </div>
      
      <div className="audio-card-footer">
        <div className="audio-info">
          <span className="audio-size">{formatFileSize(audio.size_mb)}</span>
        </div>
        
        <button 
          className="play-button"
          onClick={onPlay}
          title={`Lire ${audio.title}`}
        >
          <span className="play-icon">▶️</span>
          Lire
        </button>
      </div>
      
      <div className="audio-path" title={audio.path}>
        📁 {audio.folder === '.' ? 'Racine' : audio.folder}
      </div>
    </div>
  );
}