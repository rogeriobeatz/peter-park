import React, { useState, useRef, useEffect } from 'react';
import styles from './BackgroundMusic.module.css';

const TRACKS = [
  { id: 'happy', label: 'Feliz 🌈', file: '/music/happy.mp3' },
  { id: 'piano', label: 'Calmo 🎹', file: '/music/piano.mp3' },
  { id: 'upbeat', label: 'Brincar 🎈', file: '/music/upbeat.mp3' },
];

const BackgroundMusic: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.14;
    }
  }, []);

  const toggleTrack = (trackId: string) => {
    if (currentTrack === trackId) {
      audioRef.current?.pause();
      setCurrentTrack(null);
    } else {
      const track = TRACKS.find(t => t.id === trackId);
      if (track && audioRef.current) {
        audioRef.current.src = track.file;
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        setCurrentTrack(trackId);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <audio ref={audioRef} loop />
      
      {/* Track Options */}
      <div className={`${styles.options} ${isOpen ? styles.open : ''}`}>
        {TRACKS.map((track) => (
          <button
            key={track.id}
            className={`${styles.trackBtn} bouncy-tap ${currentTrack === track.id ? styles.active : ''}`}
            onClick={() => toggleTrack(track.id)}
          >
            <span className={styles.btnLabel}>{track.label}</span>
          </button>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button 
        className={`${styles.mainBtn} bouncy-tap ${currentTrack ? styles.playing : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.icon}>{currentTrack ? '🎵' : '🔇'}</span>
      </button>
    </div>
  );
};

export default BackgroundMusic;
