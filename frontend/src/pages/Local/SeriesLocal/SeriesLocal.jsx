import { useState, useEffect } from 'react';
import axios from 'axios';
import "./SeriesLocal.css";
import BackButton from "../../../components/BackButton/BackButton";
import SeriesList from "../../../components/SeriesList/SeriesList";
import EpisodeList from "../../../components/EpisodeList/EpisodeList";

export default function SeriesLocal() {
  const [series, setSeries] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showSeries, setShowSeries] = useState(false);
  const [view, setView] = useState('series');

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://127.0.0.1:8000/series/local');
      setSeries(response.data.series);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des séries locales:', error);
      setLoading(false);
    }
  };

  const fetchEpisodes = async (seriesName) => {
    try {
      setEpisodesLoading(true);
      const encodedName = encodeURIComponent(seriesName);
      const response = await axios.get(`http://127.0.0.1:8000/series/local/${encodedName}/episodes`);
      setEpisodes(response.data.episodes);
      setEpisodesLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des épisodes:', error);
      setEpisodesLoading(false);
    }
  };

  const handleShowSeries = () => {
    if (!showSeries) {
      fetchSeries();
    }
    setShowSeries(!showSeries);
    setView('series');
    setSelectedSeries(null);
  };

  const handleSeriesClick = (serie) => {
    setSelectedSeries(serie);
    setView('episodes');
    fetchEpisodes(serie.name);
  };

  const handleBackToSeries = () => {
    setView('series');
    setSelectedSeries(null);
    setEpisodes([]);
  };

  useEffect(() => {
  }, []);

  return (
    <div className="series-local-container">
      <div className="series-local-content">
        <div className="hero-section">
          <h1>Séries Locales</h1>
          <p className="hero-subtitle">Gérez votre collection de séries locales organisées par dossiers</p>
        </div>
        
        {!showSeries && (
          <div className="actions-section">
            <button 
              className="access-series-btn"
              onClick={handleShowSeries}
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Accéder à mes séries locales'}
            </button>
          </div>
        )}

        {showSeries && view === 'series' && (
          <div className="series-section">
            <div className="section-header">
              <h2>Mes séries ({series.length} série{series.length !== 1 ? 's' : ''})</h2>
              <button 
                className="hide-series-btn"
                onClick={handleShowSeries}
              >
                Masquer les séries
              </button>
            </div>
            <SeriesList series={series} onSeriesClick={handleSeriesClick} />
          </div>
        )}

        {showSeries && view === 'episodes' && selectedSeries && (
          <div className="episodes-section">
            <div className="section-header">
              <button 
                className="back-to-series-btn"
                onClick={handleBackToSeries}
              >
                ← Retour aux séries
              </button>
            </div>
            {episodesLoading ? (
              <div className="loading-episodes">
                <p>Chargement des épisodes...</p>
              </div>
            ) : (
              <EpisodeList episodes={episodes} seriesName={selectedSeries.name} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
