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
    fetchSeries();
  }, []);

  return (
    <div className="series-local-container">
      <div className="series-local-content">
        {loading ? (
          <div className="loading-section">
            <p>Chargement des séries...</p>
          </div>
        ) : (
          <>
            {view === 'series' && (
              <div className="series-section">
                <div className="section-header">
                  <h2>Mes séries ({series.length} série{series.length !== 1 ? 's' : ''})</h2>
                </div>
                <SeriesList series={series} onSeriesClick={handleSeriesClick} />
              </div>
            )}

            {view === 'episodes' && selectedSeries && (
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
          </>
        )}
      </div>
    </div>
  );
}
