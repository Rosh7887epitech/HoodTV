import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import xtreamService from '../../../services/xtreamService';
import { validateCredentials, parseXtreamUrl } from '../../../services/xtreamUtils';
import BackButton from '../../../components/BackButton/BackButton';
import './AddXtreamAccount.css';

export default function AddXtreamAccount() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '8080',
    username: '',
    password: '',
    protocol: 'http'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // Définir l'utilisateur courant au chargement
    const userId = localStorage.getItem('userId');
    if (userId) {
      xtreamService.setCurrentUser(parseInt(userId));
    } else {
      setError('Utilisateur non connecté');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleUrlParse = () => {
    const parsed = parseXtreamUrl(fullUrl);
    
    if (parsed) {
      setFormData(prev => ({
        ...prev,
        host: parsed.host,
        port: parsed.port,
        username: parsed.username,
        password: parsed.password,
        protocol: parsed.protocol
      }));
      setUrlMode(false);
      setError('');
      setSuccess('URL analysée avec succès !');
    } else {
      setError('URL invalide. Format attendu: http://host:port/get.php?username=XXX&password=YYY');
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setSuccess('');
    
    const validation = validateCredentials(formData);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setLoading(true);
    setTestMode(true);

    try {
      const result = await xtreamService.testConnection(formData);
      
      if (result.success) {
        setSuccess(`✓ Connexion réussie ! Serveur: ${result.serverInfo?.server_protocol || 'N/A'} - Expiration: ${result.userInfo?.exp_date || 'N/A'}`);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du test de connexion');
    } finally {
      setLoading(false);
      setTestMode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Vérifier que l'utilisateur est connecté
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Utilisateur non connecté');
      return;
    }
    
    // S'assurer que l'utilisateur est défini dans le service
    xtreamService.setCurrentUser(parseInt(userId));
    
    const validation = validateCredentials(formData);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setLoading(true);

    try {
      await xtreamService.addAccount(formData);
      setSuccess('Compte ajouté avec succès !');
      
      setTimeout(() => {
        navigate('/xtream');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'ajout du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-xtream-page">
      <div className="add-xtream-container">
        <div className="add-xtream-header">
          <h1 className="add-xtream-title">Ajouter un compte Xtream Codes</h1>
          <p className="add-xtream-subtitle">
            Connectez-vous à votre serveur Xtream pour accéder aux chaînes live, films et séries
          </p>
        </div>

        <div className="add-xtream-mode-switch">
          <button
            type="button"
            className={`mode-btn ${!urlMode ? 'active' : ''}`}
            onClick={() => setUrlMode(false)}
          >
            Saisie manuelle
          </button>
          <button
            type="button"
            className={`mode-btn ${urlMode ? 'active' : ''}`}
            onClick={() => setUrlMode(true)}
          >
            Import URL
          </button>
        </div>

        {urlMode ? (
          <div className="url-import-section">
            <div className="form-group">
              <label htmlFor="fullUrl" className="form-label">
                URL complète Xtream
              </label>
              <input
                type="text"
                id="fullUrl"
                className="form-input"
                placeholder="http://host:port/get.php?username=XXX&password=YYY"
                value={fullUrl}
                onChange={(e) => setFullUrl(e.target.value)}
              />
              <small className="form-hint">
                Collez l'URL complète fournie par votre fournisseur Xtream
              </small>
            </div>
            
            <button
              type="button"
              onClick={handleUrlParse}
              className="btn btn-secondary"
              disabled={!fullUrl}
            >
              Analyser l'URL
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="add-xtream-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nom du compte (optionnel)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Mon serveur IPTV"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="protocol" className="form-label">
                  Protocole
                </label>
                <select
                  id="protocol"
                  name="protocol"
                  className="form-select"
                  value={formData.protocol}
                  onChange={handleChange}
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>

              <div className="form-group flex-grow">
                <label htmlFor="host" className="form-label">
                  Hôte *
                </label>
                <input
                  type="text"
                  id="host"
                  name="host"
                  className="form-input"
                  placeholder="exemple.com"
                  value={formData.host}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="port" className="form-label">
                  Port *
                </label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  className="form-input"
                  placeholder="8080"
                  value={formData.port}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Nom d'utilisateur *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                placeholder="Votre nom d'utilisateur"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span className="alert-message">{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <span className="alert-icon">✓</span>
                <span className="alert-message">{success}</span>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleTestConnection}
                className="btn btn-secondary"
                disabled={loading}
              >
                {testMode ? 'Test en cours...' : 'Tester la connexion'}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading && !testMode ? 'Ajout en cours...' : 'Ajouter le compte'}
              </button>
            </div>
          </form>
        )}

        <div className="add-xtream-help">
          <h3 className="help-title">💡</h3>
          <ul className="help-list">
            <li>L'hôte est l'adresse du serveur (ex: iptv.example.com)</li>
            <li>Le port est généralement 8080 ou 80</li>
            <li>Les identifiants sont fournis par votre fournisseur IPTV</li>
            <li>Testez d'abord la connexion avant d'ajouter le compte</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
