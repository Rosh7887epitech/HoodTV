import "./SeriesCard.css";

export default function SeriesCard({ series, onClick }) {
  return (
    <div className="series-card" onClick={() => onClick(series)}>
      <div className="series-card-content">
        <div className="series-icon">
          📁
        </div>
        <div className="series-info">
          <h3 className="series-title">{series.name}</h3>
          <p className="series-details">
            {series.episode_count} épisode{series.episode_count !== 1 ? 's' : ''}
          </p>
          <p className="series-size">
            {series.total_size_mb} MB
          </p>
        </div>
      </div>
    </div>
  );
}