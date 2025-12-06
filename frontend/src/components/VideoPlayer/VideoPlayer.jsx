import { useState, useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/city/index.css';
import 'videojs-hotkeys';
import './VideoPlayer.css';

export default function VideoPlayer({ movie, onClose }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Déterminer l'URL du stream
  // Si movie.direct est true (Xtream), utiliser l'URL directe
  // Sinon, utiliser le proxy backend pour les fichiers locaux
  const streamUrl = movie.direct 
    ? movie.path 
    : `http://127.0.0.1:8000/stream/${encodeURIComponent(movie.path)}`;

  // Déterminer le type de média
  const mediaType = movie.direct && movie.path.includes('.m3u8') 
    ? 'application/x-mpegURL' 
    : 'video/mp4';

  useEffect(() => {
    if (playerRef.current) {
      return;
    }

    const videoJsOptions = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      sources: [{
        src: streamUrl,
        type: mediaType
      }],
      html5: {
        hlsjsConfig: {
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90
        },
        vhs: {
          withCredentials: false,
          overrideNative: true,
          smoothQualityChange: true
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
      },
      className: 'vjs-theme-city',
      plugins: {
        hotkeys: {
          volumeStep: 0.1,
          seekStep: 10,
          enableModifiersForNumbers: false,
          fullscreenKey: function(event, player) {
            return (event.which === 70);
          },
          playPauseKey: function(event, player) {
            return (event.which === 32);
          }
        }
      }
    };

    const timer = setTimeout(() => {
      if (videoRef.current && !playerRef.current) {
        try {
          playerRef.current = videojs(videoRef.current, videoJsOptions, () => {
            console.log('Video.js player is ready');
            setIsLoading(false);
          });

          playerRef.current.on('error', (error) => {
            console.error('Erreur Video.js:', error);
            setError('Erreur lors du chargement de la vidéo');
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
          console.error('Erreur lors de l\'initialisation de Video.js:', err);
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
          console.error('Erreur lors de la destruction du player:', err);
        }
        playerRef.current = null;
      }
    };
  }, [streamUrl, onClose]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (err) {
          console.error('Erreur lors de la destruction du player:', err);
        }
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="video-player-overlay">
      <div className="video-player-container">
        <div className="video-header">
          <h2>{movie.title}</h2>
          <div className="header-right">
            <span className="keyboard-hint" title="Raccourcis: Espace (play/pause), F (plein écran), Échap (fermer), ←/→ (navigation)">
              ⌨️
            </span>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="video-wrapper">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Chargement de la vidéo...</p>
            </div>
          )}

          {error && (
            <div className="error-overlay">
              <div className="error-message">
                <h3>❌ Erreur de lecture</h3>
                <p>{error}</p>
                <button onClick={onClose} className="error-close-btn">
                  Fermer
                </button>
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