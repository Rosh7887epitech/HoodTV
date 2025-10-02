import axios from "axios";

export default function MovieCard({ movie, refresh }) {
  const handleDelete = async () => {
    await axios.delete(`http://127.0.0.1:8000/movies/${movie.id}`);
    refresh();
  };

  return (
    <div className="movie-card">
      {movie.poster_url && <img src={movie.poster_url} alt={movie.title} className="movie-poster" />}
      <h2>{movie.title} ({movie.year || "?"})</h2>
      <button onClick={handleDelete}>Supprimer</button>
    </div>
  );
}
