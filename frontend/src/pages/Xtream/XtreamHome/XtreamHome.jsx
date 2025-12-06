import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import xtreamService from '../../../services/xtreamService';
import Card from '../../../components/Card/Card';
import './XtreamHome.css';

export default function XtreamHome() {
  const navigate = useNavigate();
  const [currentAccount, setCurrentAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    setLoading(true);
    const allAccounts = xtreamService.getAllAccounts();
    const current = xtreamService.getCurrentAccount();
    
    setAccounts(allAccounts);
    setCurrentAccount(current);
    setLoading(false);
  };

  const handleAccountChange = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      xtreamService.setCurrentAccount(account);
      setCurrentAccount(account);
    }
  };

  const handleDeleteAccount = (accountId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      xtreamService.removeAccount(accountId);
      loadAccounts();
    }
  };

  if (loading) {
    return (
      <div className="xtream-home">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="xtream-home">
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <h2 className="empty-title">Aucun compte Xtream configuré</h2>
          <p className="empty-description">
            Ajoutez un compte Xtream Codes pour accéder aux chaînes live, films et séries
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/xtream/add-account')}
          >
            + Ajouter un compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="xtream-home">
      <div className="xtream-header">
        <div>
          <h1 className="xtream-title">Xtream Codes</h1>
          <p className="xtream-subtitle">Accédez à vos contenus IPTV</p>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={() => navigate('/xtream/add-account')}
        >
          + Ajouter un compte
        </button>
      </div>

      {/* Account Selector */}
      <div className="account-section">
        <h2 className="section-title">Compte actif</h2>
        
        <div className="account-selector">
          <select
            className="account-select"
            value={currentAccount?.id || ''}
            onChange={(e) => handleAccountChange(e.target.value)}
          >
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.username}@{account.host})
              </option>
            ))}
          </select>
        </div>

        {currentAccount && (
          <div className="account-info">
            <div className="account-info-item">
              <span className="info-label">Serveur:</span>
              <span className="info-value">{currentAccount.host}:{currentAccount.port}</span>
            </div>
            <div className="account-info-item">
              <span className="info-label">Utilisateur:</span>
              <span className="info-value">{currentAccount.username}</span>
            </div>
            {currentAccount.userInfo?.exp_date && (
              <div className="account-info-item">
                <span className="info-label">Expiration:</span>
                <span className="info-value">{currentAccount.userInfo.exp_date}</span>
              </div>
            )}
            {currentAccount.userInfo?.status && (
              <div className="account-info-item">
                <span className="info-label">Statut:</span>
                <span className={`info-value status-${currentAccount.userInfo.status}`}>
                  {currentAccount.userInfo.status === 'Active' ? '✓ Actif' : '⚠ Inactif'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Navigation */}
      <div className="content-section">
        <h2 className="section-title">Contenu disponible</h2>
        
        <div className="content-grid">
          <Card
            title="Chaînes Live"
            img={null}
            link="/xtream/live"
          />
          <Card
            title="Films"
            img={null}
            link="/xtream/movies"
          />
          <Card
            title="Séries"
            img={null}
            link="/xtream/series"
          />
        </div>
      </div>

      {/* Account Management */}
      <div className="manage-section">
        <h2 className="section-title">Gestion des comptes</h2>
        
        <div className="accounts-list">
          {accounts.map(account => (
            <div key={account.id} className="account-card">
              <div className="account-card-header">
                <h3 className="account-card-title">{account.name}</h3>
                {currentAccount?.id === account.id && (
                  <span className="account-badge">Actif</span>
                )}
              </div>
              
              <div className="account-card-body">
                <p className="account-detail">
                  <span className="detail-icon">🌐</span>
                  {account.protocol}://{account.host}:{account.port}
                </p>
                <p className="account-detail">
                  <span className="detail-icon">👤</span>
                  {account.username}
                </p>
              </div>
              
              <div className="account-card-actions">
                {currentAccount?.id !== account.id && (
                  <button
                    className="btn-small btn-secondary"
                    onClick={() => handleAccountChange(account.id)}
                  >
                    Activer
                  </button>
                )}
                <button
                  className="btn-small btn-danger"
                  onClick={() => handleDeleteAccount(account.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
