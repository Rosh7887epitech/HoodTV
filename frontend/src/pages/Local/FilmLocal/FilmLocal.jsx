import { useState, useEffect } from 'react';
import axios from 'axios';
import "./FilmLocal.css";
import BackButton from "../../../components/BackButton/BackButton";
import LocalMovieList from "../../../components/LocalMovieList/LocalMovieList";
import "../../../components/LocalMovieCard/LocalMovieCard.css";
import "../../../components/LocalMovieList/LocalMovieList.css";

export default function FilmLocal() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://127.0.0.1:8000/movies/local');
      setMovies(response.data.movies);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des films locaux:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <div className="film-local-container">
      <div className="film-local-content">
        <div className="hero-section">
          <h1>Films Locaux</h1>
          <p className="hero-subtitle">Gérez votre collection de films locale</p>
        </div>

        {loading ? (
          <div className="loading-section">
            <p>Chargement des films...</p>
          </div>
        ) : (
          <div className="movies-section">
            <h2>Mes films locaux ({movies.length} film{movies.length !== 1 ? 's' : ''})</h2>
            <LocalMovieList movies={movies} />
          </div>
        )}
      </div>
    </div>
  );
}
