import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:8000';

const favoritesService = {
  getFavorites: async (userId) => {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/users/${userId}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.favorites;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de la récupération des favoris';
    }
  },

  addToFavorites: async (userId, favorite) => {
    try {
      const token = authService.getToken();
      const response = await axios.post(
        `${API_URL}/users/${userId}/favorites`,
        favorite,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de l\'ajout aux favoris';
    }
  },

  removeFromFavorites: async (userId, favoriteId) => {
    try {
      const token = authService.getToken();
      const response = await axios.delete(
        `${API_URL}/users/${userId}/favorites/${favoriteId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Erreur lors de la suppression du favori';
    }
  }
};

export default favoritesService;
