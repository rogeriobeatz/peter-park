import React, { useState, useRef } from 'react';
import styles from './MusicGame.module.css';
import { playPopSound } from '../utils/audio';

type Instrument = 'xylophone' | 'drums' | 'guitar';

const INSTRUMENTS: Instrument[] = ['xylophone', 'drums', 'guitar'];

const MusicGame: React.FC = () => {
  const [currentIdx, setCurrentInstrumentIdx] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playNote = (freq: number, type: OscillatorType = 'sine', decay = 0.5) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + decay);
  };

  const playDrum = (type: 'kick' | 'snare') => {
    initAudio();
    const ctx = audioCtxRef.current!;
    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }
  };

  const nextInstrument = () => {
    setCurrentInstrumentIdx((prev) => (prev + 1) % INSTRUMENTS.length);
    playPopSound(400);
  };

  const prevInstrument = () => {
    setCurrentInstrumentIdx((prev) => (prev - 1 + INSTRUMENTS.length) % INSTRUMENTS.length);
    playPopSound(400);
  };

  const currentInstrument = INSTRUMENTS[currentIdx];

  return (
    <div className={styles.container} onPointerDown={initAudio}>
      <header className={styles.header}>
        <h2 className={styles.title}>Banda do Peter 🎵</h2>
      </header>

      <div className={styles.stage}>
        <button className={styles.arrowLeft} onClick={prevInstrument}>◀️</button>
        
        <div className={styles.instrumentArea}>
          {currentInstrument === 'xylophone' && (
            <div className={styles.xylophone}>
              {[261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25].map((f, i) => (
                <div 
                  key={i} 
                  className={styles.bar} 
                  style={{ backgroundColor: `hsl(${i * 45}, 70%, 60%)`, height: `${100 - i * 5}%` }}
                  onPointerDown={() => playNote(f, 'triangle', 0.8)}
                />
              ))}
            </div>
          )}

          {currentInstrument === 'drums' && (
            <div className={styles.drums}>
              <div className={styles.snare} onPointerDown={() => playDrum('snare')}>🥁</div>
              <div className={styles.kick} onPointerDown={() => playDrum('kick')}>🥁</div>
              <div className={styles.cymbal} onPointerDown={() => playNote(1000, 'sine', 0.1)}>🟡</div>
            </div>
          )}

          {currentInstrument === 'guitar' && (
            <div className={styles.guitar}>
              {[196.00, 246.94, 329.63, 392.00, 440.00, 523.25].map((f, i) => (
                <div 
                  key={i} 
                  className={styles.string} 
                  onPointerEnter={() => playNote(f, 'sawtooth', 1)}
                  onPointerDown={() => playNote(f, 'sawtooth', 1)}
                />
              ))}
            </div>
          )}
        </div>

        <button className={styles.arrowRight} onClick={nextInstrument}>▶️</button>
      </div>

      <div className={styles.instrumentLabel}>
        {currentInstrument === 'xylophone' && 'Xilofone Colorido'}
        {currentInstrument === 'drums' && 'Bateria Maluca'}
        {currentInstrument === 'guitar' && 'Violão do Peter'}
      </div>
    </div>
  );
};

export default MusicGame;
