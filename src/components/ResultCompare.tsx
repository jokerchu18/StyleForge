import { useMemo, useRef, useState } from 'react';
import { en } from '../i18n/en';
import { downloadCanvas } from '../lib/imageUtils';

interface Props {
  original: HTMLCanvasElement;
  result: HTMLCanvasElement;
  style: string;
  onReset: () => void;
  /** Label for the result side; defaults to en.compareResult ("Anime"). */
  resultLabel?: string;
}

export default function ResultCompare({
  original,
  result,
  style,
  onReset,
  resultLabel,
}: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate PNG data URLs once per canvas — regenerating on every pointer
  // move made dragging the slider extremely janky.
  const resultUrl = useMemo(() => result.toDataURL('image/png'), [result]);
  const originalUrl = useMemo(() => original.toDataURL('image/png'), [original]);

  const setFromEvent = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  return (
    <section className="result-section">
      <div
        ref={containerRef}
        className="compare"
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromEvent(e.clientX);
        }}
        onPointerDown={(e) => setFromEvent(e.clientX)}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-label={`${en.compareOriginal} / ${resultLabel ?? en.compareResult}`}
      >
        {/* Result on top (full) */}
        <img
          className="compare-result"
          src={resultUrl}
          alt={`${style} anime result`}
          draggable={false}
        />
        {/* Original clipped by slider */}
        <div className="compare-original-clip" style={{ width: `${position}%` }}>
          <img
            className="compare-original"
            src={originalUrl}
            alt="Original photo"
            draggable={false}
          />
        </div>
        <div className="compare-slider" style={{ left: `${position}%` }}>
          <span className="slider-handle">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m14 7-5 5 5 5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m10 7 5 5-5 5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <span className="compare-label label-original">{en.compareOriginal}</span>
        <span className="compare-label label-result">{resultLabel ?? en.compareResult}</span>
      </div>

      <div className="result-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => downloadCanvas(result, `anime-${style}.png`)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="m7 11 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          {en.download}
        </button>
        <button type="button" className="btn-ghost" onClick={onReset}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
          {en.tryAgain}
        </button>
      </div>
    </section>
  );
}
