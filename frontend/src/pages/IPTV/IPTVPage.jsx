// frontend/src/pages/IPTV/IPTVPage.jsx
import { useState } from 'react';
import BackButton from '../../components/BackButton/BackButton';
import IPTVManager from '../../components/IPTVManager/IPTVManager';
import './IPTVPage.css';

export default function IPTVPage() {
  return (
    <div className="iptv-page-container">
      <BackButton path="/streaming" />
      
      <div className="iptv-page-content">
        <div className="iptv-hero">
          <h1>📡 IPTV Streaming</h1>
          <p className="iptv-subtitle">
            Regardez vos chaînes préférées en direct
          </p>
        </div>

        <div className="iptv-info-banner">
          <div className="info-item">
            <span className="info-icon">✅</span>
            <div>
              <strong>Support HLS & M3U8</strong>
              <p>Compatible avec la plupart des flux IPTV</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🚀</span>
            <div>
              <strong>Streaming Optimisé</strong>
              <p>Proxy intégré pour contourner les restrictions CORS</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🎮</span>
            <div>
              <strong>Contrôles Intuitifs</strong>
              <p>Raccourcis clavier et interface moderne</p>
            </div>
          </div>
        </div>

        <IPTVManager />
      </div>
    </div>
  );
}