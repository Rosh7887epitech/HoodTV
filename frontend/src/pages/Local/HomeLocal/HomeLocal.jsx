import { useState, useEffect } from 'react';
import axios from 'axios';
import "./HomeLocal.css";
import ContentSlider from "../../../components/ContentSlider/ContentSlider";
import LocalMovieCard from "../../../components/LocalMovieCard/LocalMovieCard";
import SeriesCard from "../../../components/SeriesCard/SeriesCard";
import LocalAudioCard from "../../../components/LocalAudioCard/LocalAudioCard";
import { useNavigate } from 'react-router-dom';

export default function HomeLocal() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      
      const [moviesRes, seriesRes, photosRes, audioRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/movies/local').catch(() => ({ data: { movies: [] } })),
        axios.get('http://127.0.0.1:8000/series/local').catch(() => ({ data: { series: [] } })),
        axios.get('http://127.0.0.1:8000/photos/local').catch(() => ({ data: { photos: [] } })),
        axios.get('http://127.0.0.1:8000/audio/local').catch(() => ({ data: { audio: [] } }))
      ]);

      setMovies(moviesRes.data.movies?.slice(0, 10) || []);
      setSeries(seriesRes.data.series?.slice(0, 10) || []);
      setPhotos(photosRes.data.photos?.slice(0, 10) || []);
      setAudioFiles(audioRes.data.audio?.slice(0, 10) || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu local:', error);
      setLoading(false);
    }
  };

  const handleSeriesClick = (serie) => {
    navigate('/local-series');
  };

  const handleAudioPlay = (audio) => {
    navigate('/local-audio');
  };

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openPhoto = (photoPath) => {
    const encodedPath = encodeURIComponent(photoPath);
    window.open(`http://127.0.0.1:8000/view-image/${encodedPath}`, '_blank');
  };

  const renderPhotoCard = (photo) => (
    <div className="photo-card-slider" onClick={() => openPhoto(photo.path)}>
      <div className="photo-thumbnail">
        <img 
          src={`http://127.0.0.1:8000/thumbnail/${encodeURIComponent(photo.path)}`}
          alt={photo.title}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = '<div class="photo-placeholder">🖼️</div>';
          }}
        />
      </div>
      <div className="photo-info">
        <div className="photo-title" title={photo.title}>
          {photo.title}
        </div>
        <div className="photo-details">
          {photo.extension.toUpperCase()}
        </div>
        <div className="photo-size">
          {formatFileSize(photo.size_bytes)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="home-local-container">
      <div className="home-local-content">

        {loading ? (
          <div className="loading-section">
            <p>Chargement du contenu...</p>
          </div>
        ) : (
          <div className="sliders-container">
            <ContentSlider
              title="Films"
              items={movies}
              renderCard={(movie) => <LocalMovieCard movie={movie} />}
              linkTo="/local-movies"
              emptyMessage="Aucun film trouvé"
            />

            <ContentSlider
              title="Séries"
              items={series}
              renderCard={(serie) => <SeriesCard series={serie} onClick={handleSeriesClick} />}
              linkTo="/local-series"
              emptyMessage="Aucune série trouvée"
            />

            <ContentSlider
              title="Photos"
              items={photos}
              renderCard={renderPhotoCard}
              linkTo="/local-photos"
              emptyMessage="Aucune photo trouvée"
            />

            <ContentSlider
              title="Musique"
              items={audioFiles}
              renderCard={(audio) => <LocalAudioCard audio={audio} onPlay={() => handleAudioPlay(audio)} />}
              linkTo="/local-audio"
              emptyMessage="Aucun fichier audio trouvé"
            />
          </div>
        )}
      </div>
    </div>
  );
}
