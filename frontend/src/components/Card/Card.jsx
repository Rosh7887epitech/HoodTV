import "./Card.css";
import { useNavigate } from "react-router-dom";

export default function Card({ title, img, link }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="card" onClick={handleClick}>
      <h2>{title}</h2>
        {img && <img src={img} alt={title} className="card-image" />}
    </div>
  );
}
