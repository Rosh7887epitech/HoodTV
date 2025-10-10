import "./SeriesList.css";
import SeriesCard from "../SeriesCard/SeriesCard";

export default function SeriesList({ series, onSeriesClick }) {
  if (!series || series.length === 0) {
    return (
      <div className="empty-series">
        <p>Aucune série trouvée</p>
      </div>
    );
  }

  return (
    <div className="series-list">
      {series.map((serie, index) => (
        <SeriesCard 
          key={index} 
          series={serie} 
          onClick={onSeriesClick}
        />
      ))}
    </div>
  );
}