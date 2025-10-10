import LocalMovieCard from "../LocalMovieCard/LocalMovieCard";

export default function LocalMovieList({ movies }) {
  if (!movies || movies.length === 0) {
    return (
      <div className="no-local-movies">
        <p>Aucun film trouvé dans le dossier local.</p>
        <p className="folder-info">Assurez-vous d'avoir des fichiers vidéo (.mp4, .avi, .mkv, etc.) dans votre dossier Films.</p>
      </div>
    );
  }

  return (
    <div className="local-movies-grid">
      {movies.map((movie, index) => (
        <LocalMovieCard key={`${movie.path}-${index}`} movie={movie} />
      ))}
    </div>
  );
}