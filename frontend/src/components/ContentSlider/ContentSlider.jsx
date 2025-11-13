import { useRef } from 'react';
import { Link } from 'react-router-dom';
import './ContentSlider.css';

export default function ContentSlider({ title, items, renderCard, linkTo, emptyMessage }) {
  const sliderRef = useRef(null);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 300;
      const newScrollPosition = sliderRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      sliderRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="content-slider-section">
        <div className="slider-header">
          <h2>{title}</h2>
          {linkTo && (
            <Link to={linkTo} className="view-all-link">
              Voir tout →
            </Link>
          )}
        </div>
        <div className="empty-slider">
          <p>{emptyMessage || 'Aucun contenu disponible'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-slider-section">
      <div className="slider-header">
        <h2>{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="view-all-link">
            Voir tout →
          </Link>
        )}
      </div>
      
      <div className="slider-container">
        {items.length > 4 && (
          <button 
            className="slider-arrow slider-arrow-left" 
            onClick={() => scroll('left')}
            aria-label="Précédent"
          >
            ‹
          </button>
        )}
        
        <div className="slider-content" ref={sliderRef}>
          {items.map((item, index) => (
            <div key={index} className="slider-item">
              {renderCard(item)}
            </div>
          ))}
        </div>
        
        {items.length > 4 && (
          <button 
            className="slider-arrow slider-arrow-right" 
            onClick={() => scroll('right')}
            aria-label="Suivant"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
