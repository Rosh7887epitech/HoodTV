import { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

export default function AudioPlayer({ audio, onClose, playlist = [], currentIndex = 0, onNext, onPrevious }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const audioUrl = `http://localhost:8000/stream-audio/${encodeURIComponent(audio.path)}`;

  useEffect(() => {
    const audioElement = audioRef.current;
    
    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(audioElement.duration);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (playlist.length > 1 && currentIndex < playlist.length - 1) {
        handleNext();
      }
    };
    
    const handleError = () => {
      setIsLoading(false);
      console.error('Erreur lors du chargement de l\'audio');
    };

    if (audioElement) {
      audioElement.addEventListener('loadeddata', handleLoadedData);
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('ended', handleEnded);
      audioElement.addEventListener('error', handleError);
      
      return () => {
        audioElement.removeEventListener('loadeddata', handleLoadedData);
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('error', handleError);
      };
    }
  }, [audio.path, playlist.length, currentIndex]);

  const togglePlay = () => {
    const audioElement = audioRef.current;
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (playlist.length > 1 && currentIndex < playlist.length - 1) {
      onNext(playlist[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (playlist.length > 1 && currentIndex > 0) {
      onPrevious(playlist[currentIndex - 1]);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player-overlay">
      <div className="audio-player">
        <button className="close-player" onClick={onClose}>
          ✕
        </button>
        
        <div className="player-header">
          <div className="audio-info">
            <h2 className="track-title">{audio.title}</h2>
            <p className="track-artist">{audio.artist}</p>
            <p className="track-album">{audio.album}</p>
          </div>
          <div className="audio-visualization">
            🎵
          </div>
        </div>

        <div className="player-controls">
          <div className="progress-container">
            <span className="time-display">{formatTime(currentTime)}</span>
            <div 
              className="progress-bar" 
              ref={progressRef}
              onClick={handleSeek}
            >
              <div 
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
              <div 
                className="progress-handle"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <span className="time-display">{formatTime(duration)}</span>
          </div>

          <div className="control-buttons">
            <button 
              className="control-btn"
              onClick={handlePrevious}
              disabled={playlist.length <= 1 || currentIndex === 0}
            >
              ⏮️
            </button>
            
            <button 
              className="play-pause-btn"
              onClick={togglePlay}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <button 
              className="control-btn"
              onClick={handleNext}
              disabled={playlist.length <= 1 || currentIndex === playlist.length - 1}
            >
              ⏭️
            </button>
          </div>

          <div className="volume-control">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
        </div>

        {playlist.length > 1 && (
          <div className="playlist-info">
            <span>Piste {currentIndex + 1} sur {playlist.length}</span>
          </div>
        )}

        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      </div>
    </div>
  );
}