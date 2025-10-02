import "./HomeIPTV.css";
import BackButton from "../../components/BackButton/BackButton";

export default function HomeIPTV() {
  return (
    <div className="home-iptv-container">
      <BackButton />
      <div className="home-iptv-content">
        <div className="hero-section">
          <h1>Streaming</h1>
          <p className="hero-subtitle">Découvrez du contenu en ligne</p>
        </div>
        <div className="categories-iptv-section">
            <div className="category-item">🎬 Films en Streaming</div>
            <div className="category-item">📺 Séries en Streaming</div>
            <div className="category-item">📡 Chaînes TV</div>
        </div>
      </div>
    </div>
  );
}
