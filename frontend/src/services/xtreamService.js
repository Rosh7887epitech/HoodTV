import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

/**
 * Service pour gérer les connexions et requêtes vers les serveurs Xtream Codes
 * Les comptes sont maintenant stockés dans la base de données par utilisateur
 */

class XtreamService {
  constructor() {
    this.currentUserId = null;
    this.currentAccount = null;
  }

  /**
   * Définit l'utilisateur courant
   * @param {number} userId - ID de l'utilisateur
   */
  setCurrentUser(userId) {
    this.currentUserId = userId;
    this.currentAccount = null;
  }

  /**
   * Récupère le token d'authentification
   * @returns {string|null} Token JWT
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Headers pour les requêtes authentifiées
   * @returns {Object} Headers avec authorization
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Non authentifié');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  /**
   * Construit l'URL de base pour les requêtes API Xtream
   * @param {Object} account - Compte Xtream avec host, port, username, password
   * @returns {string} URL de base
   */
  buildBaseUrl(account) {
    const { host, port, username, password } = account;
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const protocol = account.protocol || 'http';
    const url = `${protocol}://${cleanHost}:${port}/player_api.php?username=${username}&password=${password}`;
    return url;
  }

  /**
   * Teste la connexion à un serveur Xtream
   * @param {Object} credentials - { host, port, username, password, protocol }
   * @returns {Promise<Object>} Informations du serveur si succès
   */
  async testConnection(credentials) {
    try {
      const url = this.buildBaseUrl(credentials);
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      if (!response.data || response.status !== 200) {
        throw new Error('Connexion échouée: Réponse invalide du serveur');
      }

      if (response.data.user_info) {
        return {
          success: true,
          serverInfo: response.data.server_info,
          userInfo: response.data.user_info
        };
      } else {
        throw new Error('Identifiants invalides');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connexion timeout: Le serveur ne répond pas');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Erreur réseau: Vérifiez l\'host et le port');
      } else if (error.response) {
        throw new Error(`Erreur serveur: ${error.response.status}`);
      } else {
        throw new Error(error.message || 'Erreur de connexion inconnue');
      }
    }
  }

  /**
   * Récupère tous les comptes Xtream de l'utilisateur
   * @returns {Promise<Array>} Liste des comptes
   */
  async getAllAccounts() {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non défini');
    }

    try {
      const response = await axios.get(
        `${API_URL}/users/${this.currentUserId}/xtream-accounts`,
        this.getAuthHeaders()
      );
      return response.data.accounts || [];
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
      throw new Error('Impossible de charger les comptes');
    }
  }

  /**
   * Récupère le compte actif de l'utilisateur
   * @returns {Promise<Object|null>} Le compte actif ou null
   */
  async getCurrentAccount() {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non défini');
    }

    try {
      const response = await axios.get(
        `${API_URL}/users/${this.currentUserId}/xtream-accounts/active`,
        this.getAuthHeaders()
      );
      this.currentAccount = response.data.account;
      return this.currentAccount;
    } catch (error) {
      console.error('Erreur lors du chargement du compte actif:', error);
      this.currentAccount = null;
      return null;
    }
  }

  /**
   * Ajoute un nouveau compte Xtream
   * @param {Object} credentials - Informations de connexion
   * @returns {Promise<Object>} Le compte ajouté
   */
  async addAccount(credentials) {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non défini');
    }

    const testResult = await this.testConnection(credentials);

    const accountData = {
      name: credentials.name || `${credentials.username}@${credentials.host}`,
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      password: credentials.password,
      protocol: credentials.protocol || 'http',
      server_info: testResult.serverInfo,
      user_info: testResult.userInfo
    };

    try {
      const response = await axios.post(
        `${API_URL}/users/${this.currentUserId}/xtream-accounts`,
        accountData,
        this.getAuthHeaders()
      );
      
      // Recharger le compte actif
      await this.getCurrentAccount();
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du compte:', error);
      throw new Error('Impossible d\'ajouter le compte');
    }
  }

  /**
   * Active un compte Xtream spécifique
   * @param {number} accountId - ID du compte à activer
   * @returns {Promise<void>}
   */
  async setCurrentAccount(accountId) {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non défini');
    }

    try {
      await axios.put(
        `${API_URL}/users/${this.currentUserId}/xtream-accounts/${accountId}/activate`,
        {},
        this.getAuthHeaders()
      );
      
      // Recharger le compte actif
      await this.getCurrentAccount();
    } catch (error) {
      console.error('Erreur lors de l\'activation du compte:', error);
      throw new Error('Impossible d\'activer le compte');
    }
  }

  /**
   * Supprime un compte
   * @param {number} accountId - ID du compte à supprimer
   */
  async removeAccount(accountId) {
    if (!this.currentUserId) {
      throw new Error('Utilisateur non défini');
    }

    try {
      await axios.delete(
        `${API_URL}/users/${this.currentUserId}/xtream-accounts/${accountId}`,
        this.getAuthHeaders()
      );
      
      // Recharger le compte actif
      await this.getCurrentAccount();
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw new Error('Impossible de supprimer le compte');
    }
  }

  /**
   * Effectue une requête API Xtream
   * @param {string} action - Action à exécuter (ex: get_live_streams)
   * @param {Object} account - Compte à utiliser (optionnel, utilise le compte actif par défaut)
   * @returns {Promise<Object>} Résultat de l'API
   */
  async apiRequest(action, account = null) {
    let acc = account;
    
    if (!acc) {
      // Si pas de compte fourni, charger le compte actif
      acc = this.currentAccount || await this.getCurrentAccount();
    }

    if (!acc) {
      throw new Error('Aucun compte actif. Veuillez configurer un compte Xtream.');
    }

    try {
      const url = `${this.buildBaseUrl(acc)}&action=${action}`;
      const response = await axios.get(url, {
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: Le serveur met trop de temps à répondre');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Erreur réseau: Impossible de contacter le serveur');
      } else {
        throw new Error(error.message || 'Erreur lors de la requête API');
      }
    }
  }

  /**
   * Récupère les chaînes live
   * @returns {Promise<Array>} Liste des chaînes live
   */
  async getLiveStreams() {
    return await this.apiRequest('get_live_streams');
  }

  /**
   * Récupère les catégories de chaînes live
   * @returns {Promise<Array>} Liste des catégories
   */
  async getLiveCategories() {
    return await this.apiRequest('get_live_categories');
  }

  /**
   * Récupère les films VOD
   * @returns {Promise<Array>} Liste des films
   */
  async getVodStreams() {
    return await this.apiRequest('get_vod_streams');
  }

  /**
   * Récupère les films VOD d'une catégorie spécifique
   * @param {string} categoryId - ID de la catégorie
   * @returns {Promise<Array>} Liste des films de la catégorie
   */
  async getVodStreamsByCategory(categoryId) {
    return await this.apiRequest(`get_vod_streams&category_id=${categoryId}`);
  }

  /**
   * Récupère les catégories VOD
   * @returns {Promise<Array>} Liste des catégories
   */
  async getVodCategories() {
    return await this.apiRequest('get_vod_categories');
  }

  /**
   * Récupère les informations détaillées d'un film VOD
   * @param {string} vodId - ID du film
   * @returns {Promise<Object>} Informations détaillées
   */
  async getVodInfo(vodId) {
    return await this.apiRequest(`get_vod_info&vod_id=${vodId}`);
  }

  /**
   * Récupère toutes les séries
   * @returns {Promise<Array>} Liste des séries
   */
  async getSeries() {
    return await this.apiRequest('get_series');
  }

  /**
   * Récupère les séries d'une catégorie spécifique
   * @param {string} categoryId - ID de la catégorie
   * @returns {Promise<Array>} Liste des séries de la catégorie
   */
  async getSeriesByCategory(categoryId) {
    return await this.apiRequest(`get_series&category_id=${categoryId}`);
  }

  /**
   * Récupère les catégories de séries
   * @returns {Promise<Array>} Liste des catégories
   */
  async getSeriesCategories() {
    return await this.apiRequest('get_series_categories');
  }

  /**
   * Récupère les informations détaillées d'une série
   * @param {string} seriesId - ID de la série
   * @returns {Promise<Object>} Informations détaillées avec épisodes
   */
  async getSeriesInfo(seriesId) {
    return await this.apiRequest(`get_series_info&series_id=${seriesId}`);
  }

  /**
   * Génère l'URL de lecture pour une chaîne live
   * @param {string} streamId - ID du stream
   * @param {string} extension - Extension (m3u8 par défaut)
   * @returns {string} URL de lecture
   */
  getLiveUrl(streamId, extension = 'm3u8') {
    const acc = this.currentAccount;
    if (!acc) {
      throw new Error('Aucun compte actif');
    }

    const { host, port, username, password, protocol } = acc;
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${protocol}://${cleanHost}:${port}/live/${username}/${password}/${streamId}.${extension}`;
  }

  /**
   * Génère l'URL de lecture pour un film VOD
   * @param {string} streamId - ID du stream
   * @param {string} extension - Extension (mp4, mkv, avi...)
   * @returns {string} URL de lecture
   */
  getVodUrl(streamId, extension = 'mp4') {
    const acc = this.currentAccount;
    if (!acc) {
      throw new Error('Aucun compte actif');
    }

    const { host, port, username, password, protocol } = acc;
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${protocol}://${cleanHost}:${port}/movie/${username}/${password}/${streamId}.${extension}`;
  }

  /**
   * Génère l'URL de lecture pour un épisode de série
   * @param {string} episodeId - ID de l'épisode
   * @param {string} extension - Extension (mp4, mkv, avi...)
   * @returns {string} URL de lecture
   */
  getSeriesUrl(episodeId, extension = 'mp4') {
    const acc = this.currentAccount;
    if (!acc) {
      throw new Error('Aucun compte actif');
    }

    const { host, port, username, password, protocol } = acc;
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${protocol}://${cleanHost}:${port}/series/${username}/${password}/${episodeId}.${extension}`;
  }

  /**
   * Récupère les informations du serveur et de l'utilisateur
   * @returns {Promise<Object>} Informations complètes
   */
  async getAccountInfo() {
    return await this.apiRequest('');
  }
}

// Export singleton
export default new XtreamService();
