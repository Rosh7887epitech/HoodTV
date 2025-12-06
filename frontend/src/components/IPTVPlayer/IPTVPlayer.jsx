import { useState, useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/city/index.css';
import 'videojs-hotkeys';
import './IPTVPlayer.css';

export default function IPTVPlayer({ channel, onClose }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStreamUrl = (originalUrl, isDirect) => {
    if (isDirect) {
      return originalUrl;
    }
    return `http://127.0.0.1:8000/proxy/${encodeURIComponent(originalUrl)}`;
  };

  useEffect(() => {
    if (playerRef.current) {
      return;
    }

    const streamUrl = getStreamUrl(channel.url, channel.direct);

    const videoJsOptions = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      liveui: true,
      sources: [{
        src: streamUrl,
        type: channel.type || 'application/x-mpegURL'
      }],
      html5: {
        hlsjsConfig: {
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        },
        vhs: {
          withCredentials: false,
          overrideNative: true,
          smoothQualityChange: true
        }
      },
      className: 'vjs-theme-city',
      plugins: {
        hotkeys: {
          volumeStep: 0.1,
          seekStep: 10,
          enableModifiersForNumbers: false
        }
      }
    };

    const timer = setTimeout(() => {
      if (videoRef.current && !playerRef.current) {
        try {
          playerRef.current = videojs(videoRef.current, videoJsOptions, () => {
            console.log('Video.js IPTV player is ready');
            setIsLoading(false);
          });

          playerRef.current.on('error', (error) => {
            console.error('Erreur IPTV:', error);
            const err = playerRef.current.error();
            if (err) {
              if (err.code === 2) {
                setError('Format de flux non supporté');
              } else if (err.code === 4) {
                setError('Impossible de charger le flux (vérifiez votre connexion)');
              } else {
                setError(`Erreur de lecture: ${err.message || 'Inconnue'}`);
              }
            }
            setIsLoading(false);
          });

          playerRef.current.on('loadstart', () => {
            setIsLoading(true);
            setError(null);
          });

          playerRef.current.on('canplay', () => {
            setIsLoading(false);
          });

        } catch (err) {
          console.error('Erreur initialisation IPTV:', err);
          setError('Erreur lors de l\'initialisation du lecteur');
          setIsLoading(false);
        }
      }
    }, 100);

    const handleKeyDown = (e) => {
      if (!playerRef.current) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          if (playerRef.current.isFullscreen()) {
            playerRef.current.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case ' ':
          e.preventDefault();
          if (playerRef.current.paused()) {
            playerRef.current.play();
          } else {
            playerRef.current.pause();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (playerRef.current.isFullscreen()) {
            playerRef.current.exitFullscreen();
          } else {
            playerRef.current.requestFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (err) {
          console.error('Erreur destruction player:', err);
        }
        playerRef.current = null;
      }
    };
  }, [channel.url, onClose]);

  return (
    <div className="iptv-player-overlay">
      <div className="iptv-player-container">
        <div className="iptv-header">
          <div className="channel-info">
            <div className="channel-details">
              <h2>{channel.name}</h2>
              {channel.category && (
                <span className="channel-category">{channel.category}</span>
              )}
            </div>
          </div>
          <div className="header-right">
            <span className="live-badge">🔴 LIVE</span>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="iptv-video-wrapper">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Connexion au flux en cours...</p>
              <p className="loading-hint">Cela peut prendre quelques secondes</p>
            </div>
          )}

          {error && (
            <div className="error-overlay">
              <div className="error-message">
                <h3>Erreur de connexion</h3>
                <p>{error}</p>
                <div className="error-actions">
                  <button 
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      if (playerRef.current) {
                        playerRef.current.load();
                      }
                    }} 
                    className="retry-btn"
                  >
                    Réessayer
                  </button>
                  <button onClick={onClose} className="error-close-btn">
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div data-vjs-player>
            <video
              ref={videoRef}
              className="video-js vjs-theme-city"
              playsInline
              data-setup="{}"
            />
          </div>
        </div>
      </div>
    </div>
  );
}