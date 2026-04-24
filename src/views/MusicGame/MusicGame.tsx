import React, { useState, useRef, useCallback } from 'react';
import styles from './MusicGame.module.css';
import { playPopSound } from '../../utils/audio';

type Instrument = 'piano' | 'xylophone' | 'drums' | 'guitar';

const INSTRUMENTS = [
  { id: 'piano', icon: '🎹', label: 'Piano' },
  { id: 'xylophone', icon: '🌈', label: 'Xilofone' },
  { id: 'drums', icon: '🥁', label: 'Bateria' },
  { id: 'guitar', icon: '🎸', label: 'Violão' }
];

const NOTES = [
  { n: 'C', f: 261.63, c: '#FF6B6B' }, { n: 'D', f: 293.66, c: '#FF9F43' },
  { n: 'E', f: 329.63, c: '#FFCF00' }, { n: 'F', f: 349.23, c: '#1DD1A1' },
  { n: 'G', f: 392.00, c: '#48DBFB' }, { n: 'A', f: 440.00, c: '#54A0FF' },
  { n: 'B', f: 493.88, c: '#5F27CD' }, { n: 'C2', f: 523.25, c: '#FF6B6B' }
];

const MusicGame: React.FC = () => {
  const [currentInst, setCurrentInst] = useState<Instrument>('piano');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activePointers = useRef<Map<number, string>>(new Map());

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  }, []);

  const playSound = (freq: number, type: OscillatorType, decay = 0.8) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + decay);
  };

  const playDrum = (type: 'kick' | 'snare' | 'hihat' | 'tom') => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const now = ctx.currentTime;
    
    if (type === 'kick' || type === 'tom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(type === 'kick' ? 150 : 250, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.4);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(now + 0.4);
    } else {
      const bufSize = ctx.sampleRate * (type === 'snare' ? 0.15 : 0.05);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'snare' ? 'lowpass' : 'highpass';
      filter.frequency.value = type === 'snare' ? 1000 : 8000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(type === 'snare' ? 0.4 : 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'snare' ? 0.15 : 0.05));
      noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      noise.start();
    }
  };

  const handlePointer = (e: React.PointerEvent) => {
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (!target) return;

    const noteId = target.getAttribute('data-note-id');
    const freq = target.getAttribute('data-freq');
    const type = target.getAttribute('data-type');
    const drumType = target.getAttribute('data-drum');

    // Impede repetição do mesmo som no mesmo gesto de arraste
    if (noteId && activePointers.current.get(e.pointerId) !== noteId) {
      activePointers.current.set(e.pointerId, noteId);
      
      if (drumType) {
        playDrum(drumType as any);
      } else if (freq) {
        playSound(parseFloat(freq), (type as OscillatorType) || 'sine');
      }

      target.classList.add(styles.active);
      setTimeout(() => target.classList.remove(styles.active), 200);
    }
  };

  const clearPointer = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
  };

  return (
    <div 
      className={styles.container}
      onPointerMove={handlePointer}
      onPointerUp={clearPointer}
      onPointerLeave={clearPointer}
      onPointerCancel={clearPointer}
    >
      <div className={styles.shelf}>
        {INSTRUMENTS.map(inst => (
          <button
            key={inst.id}
            className={`${styles.instBtn} ${currentInst === inst.id ? styles.activeInst : ''}`}
            onClick={() => { setCurrentInst(inst.id as Instrument); playPopSound(400); }}
          >
            <span className={styles.instIcon}>{inst.icon}</span>
            <span className={styles.instLabel}>{inst.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.stage} onPointerDown={handlePointer}>
        {currentInst === 'piano' && (
          <div className={styles.piano}>
            {NOTES.map((n, i) => (
              <div 
                key={i} 
                data-note-id={`p-${i}`} 
                data-freq={n.f} 
                data-type="sine" 
                className={styles.pianoKey} 
                style={{ '--color': n.c } as React.CSSProperties} 
              />
            ))}
          </div>
        )}

        {currentInst === 'xylophone' && (
          <div className={styles.xylophone}>
            {NOTES.map((n, i) => (
              <div 
                key={i} 
                data-note-id={`x-${i}`} 
                data-freq={n.f} 
                data-type="triangle" 
                className={styles.xyloBar} 
                style={{ backgroundColor: n.c, height: `${100 - i * 5}%` }} 
              />
            ))}
          </div>
        )}

        {currentInst === 'drums' && (
          <div className={styles.drums}>
            <div data-note-id="d1" data-drum="kick" className={styles.drumKick}>BUMBO</div>
            <div data-note-id="d2" data-drum="snare" className={styles.drumSnare}>CAIXA</div>
            <div data-note-id="d3" data-drum="hihat" className={styles.drumHihat}>PRATO</div>
            <div data-note-id="d4" data-drum="tom" className={styles.drumTom}>TOM</div>
          </div>
        )}

        {currentInst === 'guitar' && (
          <div className={styles.guitar}>
            {[196, 246, 329, 392, 440, 523].map((f, i) => (
              <div key={i} data-note-id={`g-${i}`} data-freq={f} data-type="sawtooth" className={styles.string} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.hint}>Deslize e toque para brincar! 🎵</div>
    </div>
  );
};

export default MusicGame;
