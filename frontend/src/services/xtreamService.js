import axios from 'axios';

/**
 * Service pour gérer les connexions et requêtes vers les serveurs Xtream Codes
 * 
 * Architecture Xtream Codes API:
 * - Base URL: http(s)://HOST:PORT/player_api.php
 * - Authentification: username & password dans les query params
 * - Actions: get_live_streams, get_vod_streams, get_series, etc.
 */

class XtreamService {
  constructor() {
    this.accounts = this.loadAccounts();
    this.currentAccount = this.loadCurrentAccount();
  }

  /**
   * Charge les comptes Xtream sauvegardés depuis le localStorage
   * @returns {Array} Liste des comptes
   */
  loadAccounts() {
    try {
      const saved = localStorage.getItem('xtream_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
      return [];
    }
  }

  /**
   * Sauvegarde les comptes dans le localStorage
   * @param {Array} accounts - Liste des comptes à sauvegarder
   */
  saveAccounts(accounts) {
    try {
      localStorage.setItem('xtream_accounts', JSON.stringify(accounts));
      this.accounts = accounts;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des comptes:', error);
      throw new Error('Impossible de sauvegarder les comptes');
    }
  }

  /**
   * Charge le compte actif depuis le localStorage
   * @returns {Object|null} Le compte actif ou null
   */
  loadCurrentAccount() {
    try {
      const saved = localStorage.getItem('xtream_current_account');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Erreur lors du chargement du compte actif:', error);
      return null;
    }
  }

  /**
   * Définit le compte actif
   * @param {Object} account - Le compte à activer
   */
  setCurrentAccount(account) {
    try {
      localStorage.setItem('xtream_current_account', JSON.stringify(account));
      this.currentAccount = account;
    } catch (error) {
      console.error('Erreur lors de la définition du compte actif:', error);
      throw new Error('Impossible de définir le compte actif');
    }
  }

  /**
   * Construit l'URL de base pour les requêtes API
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
   * Ajoute un nouveau compte Xtream
   * @param {Object} credentials - Informations de connexion
   * @returns {Promise<Object>} Le compte ajouté
   */
  async addAccount(credentials) {
    const testResult = await this.testConnection(credentials);

    const newAccount = {
      id: Date.now().toString(),
      name: credentials.name || `${credentials.username}@${credentials.host}`,
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      password: credentials.password,
      protocol: credentials.protocol || 'http',
      serverInfo: testResult.serverInfo,
      userInfo: testResult.userInfo,
      addedAt: new Date().toISOString()
    };

    const accounts = [...this.accounts, newAccount];
    this.saveAccounts(accounts);

    if (accounts.length === 1) {
      this.setCurrentAccount(newAccount);
    }

    return newAccount;
  }

  /**
   * Supprime un compte
   * @param {string} accountId - ID du compte à supprimer
   */
  removeAccount(accountId) {
    const accounts = this.accounts.filter(acc => acc.id !== accountId);
    this.saveAccounts(accounts);

    if (this.currentAccount?.id === accountId) {
      this.currentAccount = accounts.length > 0 ? accounts[0] : null;
      if (this.currentAccount) {
        this.setCurrentAccount(this.currentAccount);
      } else {
        localStorage.removeItem('xtream_current_account');
      }
    }
  }

  /**
   * Récupère tous les comptes
   * @returns {Array} Liste des comptes
   */
  getAllAccounts() {
    return this.accounts;
  }

  /**
   * Récupère le compte actif
   * @returns {Object|null} Le compte actif
   */
  getCurrentAccount() {
    return this.currentAccount;
  }

  /**
   * Effectue une requête API Xtream
   * @param {string} action - Action à exécuter (ex: get_live_streams)
   * @param {Object} account - Compte à utiliser (optionnel, utilise le compte actif par défaut)
   * @returns {Promise<Object>} Résultat de l'API
   */
  async apiRequest(action, account = null) {
    const acc = account || this.currentAccount;

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
    if (!this.currentAccount) {
      throw new Error('Aucun compte actif');
    }

    const { host, port, username, password, protocol } = this.currentAccount;
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
    if (!this.currentAccount) {
      throw new Error('Aucun compte actif');
    }

    const { host, port, username, password, protocol } = this.currentAccount;
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
    if (!this.currentAccount) {
      throw new Error('Aucun compte actif');
    }

    const { host, port, username, password, protocol } = this.currentAccount;
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
