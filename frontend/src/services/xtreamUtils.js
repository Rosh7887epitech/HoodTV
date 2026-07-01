/**
 * Utilitaires pour traiter et filtrer les données Xtream Codes
 */

/**
 * Filtre une liste d'items par nom (recherche insensible à la casse)
 * @param {Array} items - Liste d'items à filtrer
 * @param {string} searchTerm - Terme de recherche
 * @returns {Array} Items filtrés
 */
export const filterByName = (items, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return items;
  
  const term = searchTerm.toLowerCase().trim();
  return items.filter(item => 
    (item.name || '').toLowerCase().includes(term) ||
    (item.title || '').toLowerCase().includes(term)
  );
};

/**
 * Filtre une liste d'items par catégorie
 * @param {Array} items - Liste d'items à filtrer
 * @param {string} categoryId - ID de la catégorie (ou 'all')
 * @returns {Array} Items filtrés
 */
export const filterByCategory = (items, categoryId) => {
  if (!categoryId || categoryId === 'all') return items;
  
  return items.filter(item => 
    String(item.category_id) === String(categoryId)
  );
};

/**
 * Groupe les items par catégorie
 * @param {Array} items - Liste d'items
 * @param {Array} categories - Liste des catégories
 * @returns {Object} Items groupés par catégorie
 */
export const groupByCategory = (items, categories) => {
  const grouped = {};
  
  categories.forEach(cat => {
    grouped[cat.category_id] = {
      category: cat,
      items: []
    };
  });
  
  items.forEach(item => {
    const catId = item.category_id;
    if (grouped[catId]) {
      grouped[catId].items.push(item);
    } else {
      // Catégorie "Autres" pour les items sans catégorie
      if (!grouped['uncategorized']) {
        grouped['uncategorized'] = {
          category: { category_id: 'uncategorized', category_name: 'Autres' },
          items: []
        };
      }
      grouped['uncategorized'].items.push(item);
    }
  });
  
  return grouped;
};

/**
 * Trie les items par nom
 * @param {Array} items - Liste d'items
 * @param {string} order - 'asc' ou 'desc'
 * @returns {Array} Items triés
 */
export const sortByName = (items, order = 'asc') => {
  return [...items].sort((a, b) => {
    const nameA = (a.name || a.title || '').toLowerCase();
    const nameB = (b.name || b.title || '').toLowerCase();
    
    if (order === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
};

/**
 * Trie les items par date d'ajout
 * @param {Array} items - Liste d'items
 * @param {string} order - 'asc' ou 'desc'
 * @returns {Array} Items triés
 */
export const sortByDate = (items, order = 'desc') => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.added || 0);
    const dateB = new Date(b.added || 0);
    
    if (order === 'desc') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });
};

/**
 * Formate la durée en heures/minutes
 * @param {string|number} duration - Durée en secondes ou format "HH:MM:SS"
 * @returns {string} Durée formatée
 */
export const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  
  let seconds = 0;
  
  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 3) {
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
  } else {
    seconds = parseInt(duration);
  }
  
  if (isNaN(seconds) || seconds <= 0) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
};

/**
 * Formate la date au format lisible
 * @param {string} dateString - Date ISO ou timestamp
 * @returns {string} Date formatée
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Récupère l'extension d'un fichier depuis le container_extension
 * @param {string} containerExtension - Extension du container (mp4, mkv, m3u8, ts...)
 * @returns {string} Extension normalisée
 */
export const getExtension = (containerExtension) => {
  if (!containerExtension) return 'mp4';
  
  const ext = containerExtension.toLowerCase();
  
  // Normaliser les extensions
  if (ext === 'matroska' || ext === 'x-matroska') return 'mkv';
  if (ext === 'mpegurl' || ext === 'vnd.apple.mpegurl') return 'm3u8';
  if (ext === 'mp2t' || ext === 'mpeg') return 'ts';
  
  return ext;
};

/**
 * Détermine le type MIME en fonction de l'extension
 * @param {string} extension - Extension du fichier
 * @returns {string} Type MIME
 */
export const getMimeType = (extension) => {
  const mimeTypes = {
    'mp4': 'video/mp4',
    'mkv': 'video/x-matroska',
    'm3u8': 'application/x-mpegURL',
    'ts': 'video/MP2T',
    'avi': 'video/x-msvideo',
    'webm': 'video/webm',
    'flv': 'video/x-flv'
  };
  
  return mimeTypes[extension] || 'video/mp4';
};

/**
 * Génère une URL d'image placeholder si l'image est manquante
 * @param {string} imageUrl - URL de l'image
 * @param {string} title - Titre pour le placeholder
 * @returns {string} URL de l'image ou placeholder
 */
export const getImageUrl = (imageUrl, title = 'N/A') => {
  if (imageUrl && imageUrl !== '') return imageUrl;
  
  // Générer une couleur basée sur le titre
  const colors = [
    '#EF233C', '#D90429', '#8D99AE', '#2B2D42', '#363849',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'
  ];
  
  const index = title.length % colors.length;
  const color = colors[index];
  const initial = title.charAt(0).toUpperCase();
  
  // SVG placeholder avec initiale
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='120' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

/**
 * Trie les épisodes d'une série par saison et numéro d'épisode
 * @param {Object} episodes - Objet contenant les épisodes groupés par saison
 * @returns {Array} Saisons triées avec épisodes triés
 */
export const sortEpisodes = (episodes) => {
  if (!episodes) return [];
  
  const seasons = Object.keys(episodes).map(seasonNum => ({
    seasonNumber: parseInt(seasonNum),
    episodes: episodes[seasonNum].sort((a, b) => 
      parseInt(a.episode_num) - parseInt(b.episode_num)
    )
  }));
  
  return seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
};

/**
 * Calcule les statistiques d'une série
 * @param {Object} seriesInfo - Informations de la série
 * @returns {Object} Statistiques (nombre de saisons, épisodes, durée totale...)
 */
export const getSeriesStats = (seriesInfo) => {
  if (!seriesInfo || !seriesInfo.episodes) {
    return {
      totalSeasons: 0,
      totalEpisodes: 0,
      totalDuration: 0
    };
  }
  
  const seasons = Object.keys(seriesInfo.episodes);
  let totalEpisodes = 0;
  let totalDuration = 0;
  
  seasons.forEach(season => {
    const episodes = seriesInfo.episodes[season];
    totalEpisodes += episodes.length;
    
    episodes.forEach(ep => {
      if (ep.duration) {
        totalDuration += parseInt(ep.duration) || 0;
      }
    });
  });
  
  return {
    totalSeasons: seasons.length,
    totalEpisodes,
    totalDuration: formatDuration(totalDuration)
  };
};

/**
 * Valide les credentials Xtream
 * @param {Object} credentials - { host, port, username, password }
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateCredentials = (credentials) => {
  const errors = [];
  
  if (!credentials.host || credentials.host.trim() === '') {
    errors.push('L\'hôte est requis');
  }
  
  if (!credentials.port || isNaN(credentials.port)) {
    errors.push('Le port doit être un nombre valide');
  }
  
  if (!credentials.username || credentials.username.trim() === '') {
    errors.push('Le nom d\'utilisateur est requis');
  }
  
  if (!credentials.password || credentials.password.trim() === '') {
    errors.push('Le mot de passe est requis');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Parse l'URL Xtream pour extraire les credentials
 * @param {string} url - URL complète Xtream
 * @returns {Object|null} Credentials extraits ou null si invalide
 */
export const parseXtreamUrl = (url) => {
  try {
    // Format: http://host:port/get.php?username=XXX&password=YYY&type=m3u_plus
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    const username = params.get('username');
    const password = params.get('password');
    const host = urlObj.hostname;
    const port = urlObj.port || '80';
    const protocol = urlObj.protocol.replace(':', '');
    
    if (username && password && host) {
      return { host, port, username, password, protocol };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};
