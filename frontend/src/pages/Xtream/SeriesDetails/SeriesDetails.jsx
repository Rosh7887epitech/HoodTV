import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import xtreamService from '../../../services/xtreamService';
import { 
  sortEpisodes, 
  getSeriesStats, 
  formatDuration, 
  getImageUrl,
  getExtension 
} from '../../../services/xtreamUtils';
import BackButton from '../../../components/BackButton/BackButton';
import VideoPlayer from '../../../components/VideoPlayer/VideoPlayer';
import './SeriesDetails.css';

export default function SeriesDetails() {
  const { seriesId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState(null);
  
  const seriesData = location.state?.series;

  useEffect(() => {
    loadSeriesInfo();
  }, [seriesId]);

  const loadSeriesInfo = async () => {
    const currentAccount = xtreamService.getCurrentAccount();
    
    if (!currentAccount) {
      setError('Aucun compte actif.');
      navigate('/xtream/add-account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const info = await xtreamService.getSeriesInfo(seriesId);
      setSeriesInfo(info);
      
      if (info.episodes) {
        const sortedSeasons = sortEpisodes(info.episodes);
        setSeasons(sortedSeasons);
        
        if (sortedSeasons.length > 0) {
          setSelectedSeason(sortedSeasons[0].seasonNumber);
        }
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des détails de la série');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayEpisode = (episode) => {
    try {
      const extension = getExtension(episode.container_extension);
      const streamUrl = xtreamService.getSeriesUrl(episode.id, extension);
      
      setCurrentEpisode({
        name: `${seriesInfo.info?.name || 'Série'} - S${episode.season}E${episode.episode_num} - ${episode.title}`,
        path: streamUrl, // URL directe Xtream
        poster: episode.info?.movie_image || seriesInfo.info?.cover,
        info: episode.info || {},
        direct: true // Flag pour utiliser l'URL directe sans proxy
      });
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleClosePlayer = () => {
    setCurrentEpisode(null);
  };

  if (loading) {
    return (
      <div className="series-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="series-details-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Erreur</h2>
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={loadSeriesInfo}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const info = seriesInfo?.info || {};
  const stats = getSeriesStats(seriesInfo);
  const currentSeasonEpisodes = seasons.find(s => s.seasonNumber === selectedSeason)?.episodes || [];

  return (
    <div className="series-details-page">
      {/* Hero Section */}
      <div className="series-hero" style={{
        backgroundImage: info.backdrop_path ? `url(${info.backdrop_path[0]})` : 'none'
      }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-poster">
            <img
              src={getImageUrl(info.cover, info.name)}
              alt={info.name}
              onError={(e) => {
                e.target.src = getImageUrl('', info.name);
              }}
            />
          </div>
          
          <div className="hero-info">
            <h1 className="series-title">{info.name || 'Série sans titre'}</h1>
            
            <div className="series-meta">
              {info.releaseDate && (
                <span className="meta-badge">{info.releaseDate}</span>
              )}
              {info.rating && parseFloat(info.rating) > 0 && (
                <span className="meta-badge">⭐ {parseFloat(info.rating).toFixed(1)}</span>
              )}
              {stats.totalSeasons > 0 && (
                <span className="meta-badge">{stats.totalSeasons} saison{stats.totalSeasons > 1 ? 's' : ''}</span>
              )}
              {stats.totalEpisodes > 0 && (
                <span className="meta-badge">{stats.totalEpisodes} épisode{stats.totalEpisodes > 1 ? 's' : ''}</span>
              )}
            </div>
            
            {info.plot && (
              <p className="series-plot">{info.plot}</p>
            )}
            
            <div className="series-details">
              {info.genre && (
                <div className="detail-item">
                  <span className="detail-label">Genre:</span>
                  <span className="detail-value">{info.genre}</span>
                </div>
              )}
              {info.director && (
                <div className="detail-item">
                  <span className="detail-label">Réalisateur:</span>
                  <span className="detail-value">{info.director}</span>
                </div>
              )}
              {info.cast && (
                <div className="detail-item">
                  <span className="detail-label">Acteurs:</span>
                  <span className="detail-value">{info.cast}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seasons & Episodes */}
      <div className="episodes-section">
        {seasons.length > 0 && (
          <>
            <div className="seasons-selector">
              <h2 className="section-title">Saisons</h2>
              <div className="seasons-tabs">
                {seasons.map(season => (
                  <button
                    key={season.seasonNumber}
                    className={`season-tab ${selectedSeason === season.seasonNumber ? 'active' : ''}`}
                    onClick={() => setSelectedSeason(season.seasonNumber)}
                  >
                    Saison {season.seasonNumber}
                    <span className="episode-count">({season.episodes.length})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="episodes-list">
              <h3 className="episodes-title">
                Épisodes - Saison {selectedSeason}
              </h3>
              
              {currentSeasonEpisodes.length === 0 ? (
                <p className="empty-episodes">Aucun épisode disponible</p>
              ) : (
                <div className="episodes-grid">
                  {currentSeasonEpisodes.map(episode => (
                    <div
                      key={episode.id}
                      className="episode-card"
                      onClick={() => handlePlayEpisode(episode)}
                    >
                      <div className="episode-thumbnail">
                        <img
                          src={getImageUrl(episode.info?.movie_image || info.cover, episode.title)}
                          alt={episode.title}
                          onError={(e) => {
                            e.target.src = getImageUrl('', episode.title);
                          }}
                        />
                        <div className="episode-overlay">
                          <span className="play-icon">▶</span>
                        </div>
                        <div className="episode-number">E{episode.episode_num}</div>
                      </div>
                      
                      <div className="episode-info">
                        <h4 className="episode-title">
                          {episode.episode_num}. {episode.title}
                        </h4>
                        
                        <div className="episode-meta">
                          {episode.duration && (
                            <span className="episode-duration">
                              ⏱️ {formatDuration(episode.duration)}
                            </span>
                          )}
                          {episode.rating && parseFloat(episode.rating) > 0 && (
                            <span className="episode-rating">
                              ⭐ {parseFloat(episode.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        
                        {episode.plot && (
                          <p className="episode-plot">{episode.plot}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Player Modal */}
      {currentEpisode && (
        <div className="player-modal">
          <div className="player-modal-overlay" onClick={handleClosePlayer}></div>
          <div className="player-modal-content">
            <VideoPlayer
              movie={currentEpisode}
              onClose={handleClosePlayer}
            />
          </div>
        </div>
      )}
    </div>
  );
}
