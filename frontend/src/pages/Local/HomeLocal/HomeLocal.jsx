import "./HomeLocal.css";
import BackButton from "../../../components/BackButton/BackButton";

export default function HomeLocal() {
  return (
    <div className="home-local-container">
      <BackButton />
      <div className="home-local-content">
        <div className="hero-section">
          <h1>Fichiers Locaux</h1>
          <p className="hero-subtitle">Explorez vos contenus stockés localement</p>
        </div>
        <div className="categories-local-section">
            <a href="/local-movies" className="category-item">📽️ Films</a>
            <a href="/local-series" className="category-item">📺 Séries</a>
            <a href="/local-photos" className="category-item">📸 Photos</a>
            <a href="/local-audio" className="category-item">🎵 Musique</a>
        </div>
      </div>
    </div>
  );
}
