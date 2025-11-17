import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../../services/authService";
import "./SelectUser.css";

export default function SelectUser() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersList = await authService.getAllUsers();
      setUsers(usersList);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    if (user.has_password) {
      setSelectedUser(user);
      setShowPasswordModal(true);
      setPassword("");
      setError("");
    } else {
      // Connexion directe sans mot de passe
      loginUser(user.name, null);
    }
  };

  const loginUser = async (name, password) => {
    try {
      await authService.login(name, password);
      navigate("/home");
    } catch (err) {
      setError("Mot de passe incorrect");
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (selectedUser) {
      loginUser(selectedUser.name, password);
    }
  };

  const handleAddUser = () => {
    navigate("/create-user");
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (index) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="select-user-page">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="select-user-page">
      <div className="select-user-container">
        <div className="select-user-header">
          <h1 className="select-user-brand">HoodTV</h1>
          <h2 className="select-user-title">Qui regarde ?</h2>
        </div>

        <div className="users-grid">
          {users.map((user, index) => (
            <div
              key={user.id}
              className="user-profile"
              onClick={() => handleUserClick(user)}
            >
              <div 
                className="user-profile-avatar"
                style={{ background: getAvatarColor(index) }}
              >
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.name} />
                ) : (
                  <span className="user-initials">{getInitials(user.name)}</span>
                )}
                {user.has_password && (
                  <div className="lock-icon">🔒</div>
                )}
              </div>
              <h3 className="user-profile-name">{user.name}</h3>
            </div>
          ))}

          <div className="user-profile add-profile" onClick={handleAddUser}>
            <div className="user-profile-avatar add-avatar">
              <span className="add-icon">➕</span>
            </div>
            <h3 className="user-profile-name">Ajouter un profil</h3>
          </div>
        </div>
      </div>

      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Entrez le mot de passe</h2>
            <p className="modal-user-name">pour {selectedUser.name}</p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                autoFocus
                className="password-input"
              />
              {error && <p className="error-message">{error}</p>}
              <div className="modal-buttons">
                <button type="submit" className="btn-submit">
                  Continuer
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
