import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './CreateUser.css';

export default function CreateUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    age: '',
    hasPassword: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Veuillez entrer un nom');
      setLoading(false);
      return;
    }

    if (formData.hasPassword && !formData.password) {
      setError('Veuillez entrer un mot de passe');
      setLoading(false);
      return;
    }

    if (formData.hasPassword && formData.password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères');
      setLoading(false);
      return;
    }

    try {
      const age = formData.age ? parseInt(formData.age) : null;
      const password = formData.hasPassword ? formData.password : null;
      
      await authService.register(formData.name, password, age);
      
      navigate('/select-user');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/select-user');
  };

  return (
    <div className="create-user-page">
      <div className="create-user-container">
        <div className="create-user-header">
          <h1 className="create-user-brand">HoodTV</h1>
          <h2 className="create-user-title">Créer un profil</h2>
        </div>

        <div className="create-user-card">
          <form onSubmit={handleSubmit} className="create-user-form">
            <div className="form-group">
              <label htmlFor="name">Nom du profil *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Papa, Maman, Enfant..."
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">Âge (optionnel)</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Votre âge"
                disabled={loading}
                min="1"
                max="150"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="hasPassword"
                  checked={formData.hasPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="checkbox-text">Protéger ce profil par mot de passe</span>
              </label>
              <p className="checkbox-hint">
                Si activé, un mot de passe sera demandé pour accéder à ce profil
              </p>
            </div>

            {formData.hasPassword && (
              <div className="form-group password-group">
                <label htmlFor="password">Mot de passe *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mot de passe (minimum 4 caractères)"
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-buttons">
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le profil'}
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
