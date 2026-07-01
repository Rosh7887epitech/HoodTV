import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import xtreamService from '../../../services/xtreamService';
import { filterByName, filterByCategory, sortByName, getImageUrl } from '../../../services/xtreamUtils';
import BackButton from '../../../components/BackButton/BackButton';
import IPTVPlayer from '../../../components/IPTVPlayer/IPTVPlayer';
import './LiveChannels.css';

export default function LiveChannels() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentChannel, setCurrentChannel] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      xtreamService.setCurrentUser(parseInt(userId));
    }
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [channels, searchTerm, selectedCategory]);

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
      const [channelsData, categoriesData] = await Promise.all([
        xtreamService.getLiveStreams(),
        xtreamService.getLiveCategories()
      ]);

      setChannels(channelsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des chaînes');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...channels];
    
    filtered = filterByName(filtered, searchTerm);
    filtered = filterByCategory(filtered, selectedCategory);
    filtered = sortByName(filtered, 'asc');
    setFilteredChannels(filtered);
  };

  const handlePlayChannel = (channel) => {
    try {
      const streamUrl = xtreamService.getLiveUrl(channel.stream_id, 'm3u8');
      
      setCurrentChannel({
        name: channel.name,
        url: streamUrl,
        logo: channel.stream_icon,
        type: 'application/x-mpegURL',
        direct: true
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClosePlayer = () => {
    setCurrentChannel(null);
  };

  if (loading) {
    return (
      <div className="live-channels-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des chaînes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="live-channels-page">
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
    <div className="live-channels-page">
      <div className="live-channels-header">
        <div>
          <h1 className="page-title">Chaînes Live</h1>
          <p className="page-subtitle">
            {filteredChannels.length} chaîne{filteredChannels.length > 1 ? 's' : ''} disponible{filteredChannels.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Rechercher une chaîne..."
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
      </div>

      {/* Channels Grid */}
      {filteredChannels.length === 0 ? (
        <div className="empty-result">
          <p className="empty-icon">🔍</p>
          <p className="empty-text">Aucune chaîne trouvée</p>
        </div>
      ) : (
        <div className="channels-grid">
          {filteredChannels.map(channel => (
            <div
              key={channel.stream_id}
              className="channel-card"
              onClick={() => handlePlayChannel(channel)}
            >
              <div className="channel-logo-wrapper">
                <img
                  src={getImageUrl(channel.stream_icon, channel.name)}
                  alt={channel.name}
                  className="channel-logo"
                  onError={(e) => {
                    e.target.src = getImageUrl('', channel.name);
                  }}
                />
                <div className="channel-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              
              <div className="channel-info">
                <h3 className="channel-name">{channel.name}</h3>
                {channel.epg_channel_id && (
                  <p className="channel-epg">Guide TV disponible</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player Modal */}
      {currentChannel && (
        <div className="player-modal">
          <div className="player-modal-overlay" onClick={handleClosePlayer}></div>
          <div className="player-modal-content">
            <IPTVPlayer
              channel={currentChannel}
              onClose={handleClosePlayer}
            />
          </div>
        </div>
      )}
    </div>
  );
}
