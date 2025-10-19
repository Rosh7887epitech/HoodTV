import { useState, useEffect } from 'react';
import axios from 'axios';
import "./PhotoLocal.css";
import BackButton from "../../../components/BackButton/BackButton";

export default function PhotoLocal() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://127.0.0.1:8000/photos/local');
      setPhotos(response.data.photos);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des photos locales:', error);
      setLoading(false);
    }
  };

  const handleShowPhotos = () => {
    if (!showPhotos) {
      fetchPhotos();
    }
    setShowPhotos(!showPhotos);
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

  useEffect(() => {
  }, []);

  return (
    <div className="photo-local-container">
      <BackButton path="/local" />
      <div className="photo-local-content">
        <div className="hero-section">
          <h1>Photos Locales</h1>
          <p className="hero-subtitle">Gérez votre collection de photos locales</p>
        </div>
        
        <div className="actions-section">
          <button 
            className="access-photos-btn"
            onClick={handleShowPhotos}
            disabled={loading}
          >
            {loading ? 'Chargement...' : showPhotos ? 'Masquer les photos' : 'Accéder à mes photos locales'}
          </button>
        </div>

        {showPhotos && (
          <div className="photos-section">
            <h2>Mes photos locales ({photos.length} photo{photos.length !== 1 ? 's' : ''})</h2>
            <div className="photos-grid">
              {photos.map((photo, index) => (
                <div key={index} className="photo-card" onClick={() => openPhoto(photo.path)}>
                  <div className="photo-thumbnail">
                    <img 
                      src={`http://127.0.0.1:8000/thumbnail/${encodeURIComponent(photo.path)}`}
                      alt={photo.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '🖼️';
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
