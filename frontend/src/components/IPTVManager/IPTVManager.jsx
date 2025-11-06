import { useState } from 'react';
import IPTVPlayer from '../IPTVPlayer/IPTVPlayer';
import './IPTVManager.css';

export default function IPTVManager() {
  const [currentChannel, setCurrentChannel] = useState(null);
  const [m3uUrl, setM3uUrl] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Exemples de chaînes IPTV (tu peux les remplacer par tes vraies URLs)
  const sampleChannels = [
    {
      name: 'Chaîne Exemple 1',
      url: 'https://example.com/stream1.m3u8',
      logo: '📺',
      category: 'Sport',
      type: 'application/x-mpegURL'
    },
    {
      name: 'Chaîne Exemple 2',
      url: 'https://example.com/stream2.m3u8',
      logo: '🎬',
      category: 'Films',
      type: 'application/x-mpegURL'
    }
  ];

  const parseM3U = async (content) => {
    const lines = content.split('\n');
    const parsed = [];
    let currentChannel = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);

        currentChannel = {
          name: nameMatch ? nameMatch[1] : 'Sans nom',
          logo: logoMatch ? logoMatch[1] : '',
          category: groupMatch ? groupMatch[1] : 'Général',
          type: 'application/x-mpegURL'
        };
      } else if (line && !line.startsWith('#') && currentChannel.name) {
        currentChannel.url = line;
        parsed.push({ ...currentChannel });
        currentChannel = {};
      }
    }

    return parsed;
  };

  const loadM3U = async () => {
    if (!m3uUrl) return;

    setLoading(true);
    try {
      const proxiedUrl = `http://127.0.0.1:8000/proxy/${encodeURIComponent(m3uUrl)}`;
      const response = await fetch(proxiedUrl);
      const content = await response.text();
      const parsed = await parseM3U(content);
      setChannels(parsed);
    } catch (error) {
      console.error('Erreur chargement M3U:', error);
      alert('Impossible de charger la liste M3U');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const content = await file.text();
      const parsed = await parseM3U(content);
      setChannels(parsed);
    } catch (error) {
      console.error('Erreur lecture fichier:', error);
      alert('Impossible de lire le fichier M3U');
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || channel.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(channels.map(c => c.category))];

  return (
    <div className="iptv-manager">
      <div className="iptv-controls">
        <h2>Gestionnaire IPTV</h2>
        
        <div className="m3u-input-section">
          <div className="url-input-group">
            <input
              type="text"
              placeholder="URL du fichier M3U (ex: https://example.com/playlist.m3u8)"
              value={m3uUrl}
              onChange={(e) => setM3uUrl(e.target.value)}
              className="m3u-url-input"
            />
            <button onClick={loadM3U} disabled={loading} className="load-btn">
              {loading ? 'Chargement...' : 'Charger'}
            </button>
          </div>

          <div className="file-input-group">
            <label htmlFor="m3u-file" className="file-label">
              Ou charger un fichier M3U local
            </label>
            <input
              id="m3u-file"
              type="file"
              accept=".m3u,.m3u8"
              onChange={handleFileUpload}
              className="file-input"
            />
          </div>

          {/* Bouton pour tester avec des chaînes d'exemple */}
          <button 
            onClick={() => setChannels(sampleChannels)} 
            className="sample-btn"
          >
            Charger des exemples
          </button>
        </div>

        {channels.length > 0 && (
          <div className="filters-section">
            <input
              type="text"
              placeholder="Rechercher une chaîne..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="search-input"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="category-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Toutes les catégories' : cat}
                </option>
              ))}
            </select>

            <div className="channels-count">
              {filteredChannels.length} chaîne{filteredChannels.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {channels.length > 0 && (
        <div className="channels-grid">
          {filteredChannels.map((channel, index) => (
            <div
              key={index}
              className="channel-card"
              onClick={() => setCurrentChannel(channel)}
            >
              <div className="channel-logo-container">
                {channel.logo.startsWith('http') ? (
                  <img src={channel.logo} alt={channel.name} className="channel-logo-img" />
                ) : (
                  <span className="channel-logo-emoji">{channel.logo}</span>
                )}
              </div>
              <div className="channel-info">
                <h3 className="channel-name">{channel.name}</h3>
                <span className="channel-category">{channel.category}</span>
              </div>
              <button className="play-btn">▶️</button>
            </div>
          ))}
        </div>
      )}

      {channels.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📺</div>
          <h3>Aucune chaîne chargée</h3>
          <p>Entrez une URL M3U ou chargez un fichier local pour commencer</p>
        </div>
      )}

      {currentChannel && (
        <IPTVPlayer
          channel={currentChannel}
          onClose={() => setCurrentChannel(null)}
        />
      )}
    </div>
  );
}