import { useState, useEffect } from "react";
import "./Favorite.css";
import axios from "axios";
import MovieList from "../../components/TMBD/MovieList";
import AddMovieForm from "../../components/TMBD/AddMovieForm";

export default function Favorite() {

  const [movies, setMovies] = useState([]);
  
  const fetchMovies = async () => {
    const res = await axios.get("http://127.0.0.1:8000/movies");
    setMovies(res.data.movies);
  };

  useEffect(() => { fetchMovies(); }, []);

  return (
    <div className="favorite-container">
      <div className="favorite-content">
        <div className="hero-section">
          <h1>Ajoute tes divertissements favoris ici</h1>
        </div>
        <div>
            <AddMovieForm refresh={fetchMovies} />
            <MovieList movies={movies} refresh={fetchMovies} />
        </div>
      </div>
    </div>
  );
}
