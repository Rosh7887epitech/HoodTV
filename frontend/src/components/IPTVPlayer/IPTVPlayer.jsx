import { useState, useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/city/index.css';
import 'videojs-hotkeys';
import './IPTVPlayer.css';

export default function IPTVPlayer({ channel, movie, onClose }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const mediaData = channel || movie;
  const mediaName = mediaData?.name || mediaData?.title || 'Lecture en cours';
  const mediaUrl = mediaData?.url || mediaData?.path;
  const isDirect = mediaData?.direct ?? false;
  const isLive = !!channel;
  
  const mediaType = mediaData?.type || 
    (isDirect && mediaUrl?.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4');
  
  const mediaCategory = mediaData?.category;
  const mediaPoster = mediaData?.poster;

  const getStreamUrl = (originalUrl, isDirect) => {
    if (isDirect) {
      return originalUrl;
    }
    return `http://127.0.0.1:8000/stream/${encodeURIComponent(originalUrl)}`;
  };

  useEffect(() => {
    if (playerRef.current) {
      return;
    }

    const streamUrl = getStreamUrl(mediaUrl, isDirect);

    const videoJsOptions = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      liveui: isLive,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      preload: 'auto',
      sources: [{
        src: streamUrl,
        type: mediaType
      }],
      html5: {
        hlsjsConfig: {
          debug: false,
          enableWorker: true,
          lowLatencyMode: isLive,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeMaxRetry: 3,
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          abrEwmaDefaultEstimate: 500000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.7,
          startFragPrefetch: true,
          testBandwidth: true
        },
        vhs: {
          withCredentials: false,
          overrideNative: true,
          smoothQualityChange: true,
          enableLowInitialPlaylist: true,
          bandwidth: 4194304,
          experimentalBufferBasedABR: false
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
            console.error('Erreur de lecture:', error);
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
          console.error('Erreur initialisation player:', err);
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
  }, [mediaUrl, isDirect, mediaType, isLive, onClose]);

  return (
    <div className="iptv-player-overlay">
      <div className="iptv-player-container">
        <div className="iptv-header">
          <h2>{mediaName}</h2>
          <div className="header-right">
            {isLive && <span className="live-badge">🔴 LIVE</span>}
            <span className="keyboard-hint" title="Raccourcis: Espace (play/pause), F (plein écran), Échap (fermer), ←/→ (navigation)">
              ⌨️
            </span>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="iptv-video-wrapper">
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