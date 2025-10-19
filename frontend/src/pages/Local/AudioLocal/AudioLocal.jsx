import { useState, useEffect } from 'react';
import './AudioLocal.css';
import BackButton from '../../../components/BackButton/BackButton';
import AudioPlayer from '../../../components/AudioPlayer/AudioPlayer';
import LocalAudioCard from '../../../components/LocalAudioCard/LocalAudioCard';

export default function AudioLocal() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/audio/local');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setAudioFiles(data.audio);
      }
    } catch (err) {
      setError('Erreur lors du chargement des fichiers audio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (audioFile) => {
    setCurrentAudio(audioFile);
  };

  const handleClosePlayer = () => {
    setCurrentAudio(null);
  };

  const filteredAndSortedAudio = audioFiles
    .filter(audio => {
      const searchLower = searchTerm.toLowerCase();
      if (filterBy === 'all') {
        return audio.title.toLowerCase().includes(searchLower) ||
               audio.artist.toLowerCase().includes(searchLower) ||
               audio.album.toLowerCase().includes(searchLower);
      } else if (filterBy === 'artist') {
        return audio.artist.toLowerCase().includes(searchLower);
      } else if (filterBy === 'album') {
        return audio.album.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'album':
          return a.album.localeCompare(b.album);
        case 'size':
          return b.size_mb - a.size_mb;
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const groupedByArtist = filteredAndSortedAudio.reduce((acc, audio) => {
    const artist = audio.artist || 'Artiste inconnu';
    if (!acc[artist]) {
      acc[artist] = [];
    }
    acc[artist].push(audio);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="audio-local-container">
        <BackButton />
        <div className="loading">Chargement des fichiers audio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audio-local-container">
        <BackButton />
        <div className="error">
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={fetchAudioFiles} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-local-container">
      <BackButton />
      
      <div className="audio-local-header">
        <h1>Musique Locale</h1>
        <p className="audio-count">
          {audioFiles.length} fichier{audioFiles.length > 1 ? 's' : ''} audio trouvé{audioFiles.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="audio-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher un titre, artiste ou album..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-sort-container">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tout</option>
            <option value="artist">Artiste</option>
            <option value="album">Album</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="title">Trier par titre</option>
            <option value="artist">Trier par artiste</option>
            <option value="album">Trier par album</option>
            <option value="size">Trier par taille</option>
          </select>
        </div>
      </div>

      <div className="audio-content">
        {Object.keys(groupedByArtist).length === 0 ? (
          <div className="no-results">
            <p>Aucun fichier audio trouvé avec ces critères</p>
          </div>
        ) : (
          Object.entries(groupedByArtist).map(([artist, audioList]) => (
            <div key={artist} className="artist-group">
              <h2 className="artist-name">🎵 {artist}</h2>
              <div className="audio-grid">
                {audioList.map((audio, index) => (
                  <LocalAudioCard
                    key={`${artist}-${index}`}
                    audio={audio}
                    onPlay={() => handlePlayAudio(audio)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {currentAudio && (
        <AudioPlayer
          audio={currentAudio}
          onClose={handleClosePlayer}
          playlist={filteredAndSortedAudio}
          currentIndex={filteredAndSortedAudio.findIndex(a => a.path === currentAudio.path)}
          onNext={(nextAudio) => setCurrentAudio(nextAudio)}
          onPrevious={(prevAudio) => setCurrentAudio(prevAudio)}
        />
      )}
    </div>
  );
}