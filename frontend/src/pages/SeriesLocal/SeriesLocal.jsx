import { useState, useEffect } from 'react';
import axios from 'axios';
import "./SeriesLocal.css";
import BackButton from "../../components/BackButton/BackButton";
import LocalMovieList from "../../components/LocalMovieList/LocalMovieList";
import "../../components/LocalMovieCard/LocalMovieCard.css";
import "../../components/LocalMovieList/LocalMovieList.css";

export default function SeriesLocal() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSeries, setShowSeries] = useState(false);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://127.0.0.1:8000/series/local');
      setSeries(response.data.series);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des series locaux:', error);
      setLoading(false);
    }
  };

  const handleShowSeries = () => {
    if (!showSeries) {
      fetchSeries();
    }
    setShowSeries(!showSeries);
  };

  useEffect(() => {
  }, []);

  return (
    <div className="series-local-container">
      <BackButton />
      <div className="series-local-content">
        <div className="hero-section">
          <h1>Séries Locaux</h1>
          <p className="hero-subtitle">Gérez votre collection de séries locales</p>
        </div>
        
        <div className="actions-section">
          <button 
            className="access-series-btn"
            onClick={handleShowSeries}
            disabled={loading}
          >
            {loading ? 'Chargement...' : showSeries ? 'Masquer les séries' : 'Accéder à mes séries locales'}
          </button>
        </div>

        {showSeries && (
          <div className="series-section">
            <h2>Mes séries locales ({series.length} série{series.length !== 1 ? 's' : ''})</h2>
            <LocalMovieList movies={series} />
          </div>
        )}
      </div>
    </div>
  );
}
