import { useState, useEffect } from 'react';
import favoritesService from '../../services/favoritesService';
import authService from '../../services/authService';
import './FavoriteButton.css';

export default function FavoriteButton({ contentType, title, metadata, onToggle }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    checkIfFavorite();
  }, [title]);

  const checkIfFavorite = async () => {
    if (!currentUser?.id) return;

    try {
      const favorites = await favoritesService.getFavorites(currentUser.id);
      const exists = favorites.some(
        fav => fav.content_type === contentType && fav.title === title
      );
      setIsFavorite(exists);
    } catch (error) {
      console.error('Erreur lors de la vérification des favoris:', error);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    
    if (!currentUser?.id) {
      alert('Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        const favorites = await favoritesService.getFavorites(currentUser.id);
        const favorite = favorites.find(
          fav => fav.content_type === contentType && fav.title === title
        );
        
        if (favorite) {
          await favoritesService.removeFromFavorites(currentUser.id, favorite.id);
          setIsFavorite(false);
          if (onToggle) onToggle(false);
        }
      } else {
        await favoritesService.addToFavorites(currentUser.id, {
          content_type: contentType,
          title: title,
          metadata: metadata
        });
        setIsFavorite(true);
        if (onToggle) onToggle(true);
      }
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`favorite-button ${isFavorite ? 'is-favorite' : ''} ${loading ? 'loading' : ''}`}
      onClick={handleToggleFavorite}
      disabled={loading}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {loading ? '⏳' : isFavorite ? '❤️' : '🤍'}
    </button>
  );
}
