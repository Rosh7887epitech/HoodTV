import "./EpisodeList.css";
import LocalMovieCard from "../LocalMovieCard/LocalMovieCard";

export default function EpisodeList({ episodes, seriesName }) {
  if (!episodes || episodes.length === 0) {
    return (
      <div className="empty-episodes">
        <p>Aucun épisode trouvé pour cette série</p>
      </div>
    );
  }

  const episodesBySeason = episodes.reduce((acc, episode) => {
    const season = episode.season_folder;
    if (!acc[season]) {
      acc[season] = [];
    }
    acc[season].push(episode);
    return acc;
  }, {});

  return (
    <div className="episode-list">
      <div className="series-header">
        <h2>📺 {seriesName}</h2>
        <p className="episode-count">{episodes.length} épisode{episodes.length !== 1 ? 's' : ''} disponible{episodes.length !== 1 ? 's' : ''}</p>
      </div>

      {Object.entries(episodesBySeason).map(([season, seasonEpisodes]) => (
        <div key={season} className="season-section">
          <h3 className="season-title">
            {season === "Racine" ? "Épisodes" : season}
            <span className="season-count">({seasonEpisodes.length})</span>
          </h3>
          <div className="episodes-grid">
            {seasonEpisodes.map((episode, index) => (
              <LocalMovieCard 
                key={index} 
                movie={episode}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}