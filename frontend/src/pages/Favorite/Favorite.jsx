import { useState, useEffect } from "react";
import "./Favorite.css";
import favoritesService from "../../services/favoritesService";
import authService from "../../services/authService";

export default function Favorite() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = authService.getCurrentUser();
  
  const fetchFavorites = async () => {
    if (!currentUser?.id) {
      setError("Utilisateur non connecté");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await favoritesService.getFavorites(currentUser.id);
      setFavorites(data);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des favoris:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    if (!currentUser?.id) return;

    try {
      await favoritesService.removeFromFavorites(currentUser.id, favoriteId);
      await fetchFavorites();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du favori");
    }
  };

  useEffect(() => { 
    fetchFavorites(); 
  }, []);

  const renderFavoriteCard = (favorite) => {
    const metadata = favorite.metadata || {};
    
    return (
      <div key={favorite.id} className="favorite-card">
        <div className="favorite-card-content">
          {/* Image */}
          {metadata.poster_url ? (
            <img 
              src={metadata.poster_url} 
              alt={favorite.title}
              className="favorite-poster"
            />
          ) : (
            <div className="favorite-poster-placeholder">
              {favorite.content_type === 'movie_tmdb' && '🎬'}
              {favorite.content_type === 'series_local' && '📺'}
              {favorite.content_type === 'audio_local' && '🎵'}
              {favorite.content_type === 'movie_local' && '🎞️'}
            </div>
          )}
          
          {/* Informations */}
          <div className="favorite-info">
            <h3>{favorite.title}</h3>
            <p className="favorite-type">
              {favorite.content_type === 'movie_tmdb' && 'Film TMDB'}
              {favorite.content_type === 'series_local' && 'Série locale'}
              {favorite.content_type === 'audio_local' && 'Audio local'}
              {favorite.content_type === 'movie_local' && 'Film local'}
            </p>
            {metadata.year && <p className="favorite-year">Année: {metadata.year}</p>}
            {metadata.episode_count && (
              <p className="favorite-episodes">{metadata.episode_count} épisodes</p>
            )}
            {metadata.artist && <p className="favorite-artist">Artiste: {metadata.artist}</p>}
            {metadata.album && <p className="favorite-album">Album: {metadata.album}</p>}
          </div>
          
          {/* Bouton supprimer */}
          <button 
            onClick={() => handleRemoveFavorite(favorite.id)}
            className="favorite-remove-btn"
            title="Retirer des favoris"
          >
            ❌
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="favorite-container">
      <div className="favorite-content">
        <div className="hero-section">
          <h1>Mes Favoris</h1>
          <p>Gérez votre playlist personnelle</p>
        </div>
        
        {loading && <p className="loading-message">Chargement...</p>}
        
        {error && (
          <div className="error-message">
            <p>Erreur: {error}</p>
          </div>
        )}
        
        {!loading && !error && favorites.length === 0 && (
          <div className="empty-favorites">
            <p>Vous n'avez pas encore de favoris.</p>
            <p>Parcourez les films, séries et musiques pour en ajouter !</p>
          </div>
        )}
        
        {!loading && !error && favorites.length > 0 && (
          <div className="favorites-grid">
            {favorites.map(renderFavoriteCard)}
          </div>
        )}
      </div>
    </div>
  );
}
