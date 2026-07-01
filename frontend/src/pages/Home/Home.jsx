import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../../services/authService";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await authService.verifyToken();
    if (!authenticated) {
      navigate("/select-user");
      return;
    }
    setCurrentUser(authService.getCurrentUser());
    setLoading(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/select-user");
  };

  const openManageModal = () => {
    setEditName(currentUser?.name || "");
    setChangePassword(false);
    setNewPassword("");
    setActionError("");
    setShowManageModal(true);
  };

  const closeManageModal = () => {
    setShowManageModal(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionLoading(true);
    try {
      const payload = { name: editName };
      if (changePassword) {
        payload.password = newPassword;
      } else if (changePassword === false) {
        payload.has_password = false;
      }

      const updated = await authService.updateUser(currentUser.id, payload);
      const updatedUser = { ...currentUser, ...updated };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setShowManageModal(false);
    } catch (err) {
      setActionError(err || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce profil ? Cette action est irréversible.')) return;
    setActionError("");
    setActionLoading(true);
    try {
      await authService.deleteUser(currentUser.id);
      authService.logout();
      navigate('/select-user');
    } catch (err) {
      setActionError(err || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="user-info">
          <span className="welcome-text">Bienvenue, {currentUser?.name} !</span>
          <div className="user-actions">
            <button className="manage-button" onClick={openManageModal} title="Gérer le profil">⚙️</button>
            <button className="logout-button" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
        <div className="hero-section">
          <h1>Bienvenue sur HoodTV</h1>
          <p className="hero-subtitle">Votre centre de divertissement personnel</p>
          <p className="hero-description">
            Utilisez le menu latéral pour naviguer entre vos contenus streaming, 
            locaux, IPTV et vos favoris.
          </p>
          <div className="home-buttons">
            <button 
              className="home-button local-button"
              onClick={() => navigate("/local")}
            >
              <span className="button-icon">📁</span>
              <span className="button-text">Contenu Local</span>
            </button>
            <button 
              className="home-button streaming-button"
              onClick={() => navigate("/streaming")}
            >
              <span className="button-icon">📺</span>
              <span className="button-text">Streaming</span>
            </button>
          </div>
        </div>
      </div>
      {showManageModal && (
        <ManageModal
          visible={showManageModal}
          user={currentUser}
          editName={editName}
          setEditName={setEditName}
          changePassword={changePassword}
          setChangePassword={setChangePassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          onClose={closeManageModal}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          loading={actionLoading}
          error={actionError}
        />
      )}
    </div>
  );
}

export function ManageModalWrapper(props) {
  return null;
}



export function ManageModal({ visible, user, editName, setEditName, changePassword, setChangePassword, newPassword, setNewPassword, onClose, onUpdate, onDelete, loading, error }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Gérer le profil</h2>
        <p className="modal-user-name">{user?.name}</p>
        <form onSubmit={onUpdate}>
          <div className="form-group">
            <label>Nom</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} /> Protéger par mot de passe
            </label>
          </div>
          {changePassword && (
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          <div className="modal-buttons">
            <button type="submit" className="btn-submit" disabled={loading}>{loading ? '...' : 'Enregistrer'}</button>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>Annuler</button>
          </div>
        </form>
        <hr />
        <div style={{ marginTop: '1rem' }}>
          <button className="btn-delete" onClick={onDelete} disabled={loading} style={{ background: 'transparent', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', padding: '0.6rem 1rem', borderRadius: '8px' }}>Supprimer le profil</button>
        </div>
      </div>
    </div>
  );
}
