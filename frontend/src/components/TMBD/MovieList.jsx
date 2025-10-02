import MovieCard from "./MovieCard";

export default function MovieList({ movies, refresh }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
      {movies.map(movie => (
        <MovieCard key={movie.id} movie={movie} refresh={refresh} />
      ))}
    </div>
  );
}
