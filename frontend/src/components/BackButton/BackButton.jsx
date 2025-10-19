import { useNavigate } from "react-router-dom";
import "./BackButton.css";

export default function BackButton({ path = "/" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(path);
  };

  return (
    <button className="back-button" onClick={handleBack}>
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M19 12H5M12 19L5 12L12 5" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      Retour à l'accueil
    </button>
  );
}