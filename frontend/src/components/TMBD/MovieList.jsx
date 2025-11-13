import LocalMovieCard from "../LocalMovieCard/LocalMovieCard";
import "./MovieList.css";

export default function MovieList({ movies, onDelete }) {
  return (
    <div className="movie-list-container">
      {movies.map(movie => (
        <LocalMovieCard key={movie.id} movie={movie} onDelete={onDelete} />
      ))}
    </div>
  );
}
