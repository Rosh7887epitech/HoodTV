import "./Home.css";
import Card from "../../components/Card/Card";

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="hero-section">
          <h1>Bienvenue sur HoodTV</h1>
          <p className="hero-subtitle">Au sein du divertissement</p>
        </div>
        <div className="categories-section">
            <Card 
              title="Streaming" 
              img="https://img.icons8.com/ios-filled/100/000000/streaming.png"
              link="/streaming"
            />
            <Card 
              title="Local" 
              img="https://img.icons8.com/ios-filled/100/000000/folder-invoices--v1.png"
              link="/local"
            />
        </div>
      </div>
    </div>
  );
}
