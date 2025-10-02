import "./HomeLocal.css";
import BackButton from "../../components/BackButton/BackButton";

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
            <div className="category-item">📽️ Films</div>
            <div className="category-item">📺 Séries</div>
            <div className="category-item">📸 Photos</div>
        </div>
      </div>
    </div>
  );
}
