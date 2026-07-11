import { useState, useEffect, useRef } from 'react';
import { LIFE_PHOTOS } from '../content/portfolio.js';
import { SectionShell } from './common.jsx';
import { REDUCED_MOTION } from '../journey/hooks.js';

export default function LifePanel({ waypoint, active = true }) {
  const [i, setI] = useState(0);
  const total = LIFE_PHOTOS.length;
  const dragX = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (REDUCED_MOTION || !active) return;
    const t = setInterval(() => setI((v) => (v + 1) % total), 3800);
    return () => clearInterval(t);
  }, [total, active]);

  const go = (d) => setI((v) => (v + d + total) % total);

  const onDown = (e) => { dragging.current = true; dragX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0; };
  const onUp = (e) => {
    if (!dragging.current) return;
    const end = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const diff = dragX.current - end;
    if (Math.abs(diff) > 44) go(diff > 0 ? 1 : -1);
    dragging.current = false;
  };

  return (
    <SectionShell
      no="06"
      label={waypoint?.title || 'Frozen Lake'}
      altitude={waypoint?.altitude || '1,050 m'}
      title={<>A slice of <span className="serif-italic">life</span></>}
      intro="Beyond the work — the reflection on the ice."
    >
      <div className="life reveal d2">
        <div
          className="life-stage"
          onMouseDown={onDown} onMouseUp={onUp}
          onTouchStart={onDown} onTouchEnd={onUp}
        >
          {LIFE_PHOTOS.map((photo, idx) => {
            const offset = (idx - i + total) % total;
            let cls = 'hide';
            if (offset === 0) cls = 'center';
            else if (offset === 1) cls = 'right';
            else if (offset === total - 1) cls = 'left';
            else if (offset === 2) cls = 'right2';
            else if (offset === total - 2) cls = 'left2';
            return (
              <figure key={idx} className={`life-card ${cls}`} onClick={() => cls !== 'center' && setI(idx)}>
                <img src={photo.src} alt={photo.label} draggable="false" />
                {cls === 'center' && (
                  <figcaption>
                    <span className="life-dot" />
                    {photo.label}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>

        <div className="life-controls">
          <button className="life-nav" onClick={() => go(-1)} aria-label="Previous">←</button>
          <div className="life-dots">
            {LIFE_PHOTOS.map((_, idx) => (
              <button
                key={idx}
                className={`life-dotbtn${idx === i ? ' on' : ''}`}
                onClick={() => setI(idx)}
                aria-label={`Photo ${idx + 1}`}
              />
            ))}
          </div>
          <button className="life-nav" onClick={() => go(1)} aria-label="Next">→</button>
        </div>
      </div>
    </SectionShell>
  );
}
