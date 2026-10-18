import { useRef, useState } from 'react';
import { secondaryBtn, primaryBtn } from './SettingsUI';

const VIEW = 240; // on-screen square, in CSS px
const OUT = 512; // exported square, in px (the server shrinks it to 256)
const MAX_ZOOM = 3;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Drag to reposition, slider to zoom. What's inside the circle is what gets
// saved. Everything is exported as a square; the server still re-validates,
// crops and resizes it.
function PhotoAdjuster({ src, fileType, busy, onSave, onCancel }) {
  const imgRef = useRef(null);
  const drag = useRef(null);
  const [nat, setNat] = useState(null); // natural size once loaded
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image top-left in the view
  const [failed, setFailed] = useState(false);

  const base = nat ? VIEW / Math.min(nat.w, nat.h) : 1; // "cover" scale
  const scale = base * zoom;

  function limit(p, s = scale) {
    if (!nat) return p;
    return {
      x: clamp(p.x, VIEW - nat.w * s, 0),
      y: clamp(p.y, VIEW - nat.h * s, 0),
    };
  }

  function handleLoad(e) {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    const s = VIEW / Math.min(w, h);
    setNat({ w, h });
    setPos({ x: (VIEW - w * s) / 2, y: (VIEW - h * s) / 2 }); // centred
  }

  function handleZoom(next) {
    // Zoom around the middle of the circle.
    const cx = (VIEW / 2 - pos.x) / scale;
    const cy = (VIEW / 2 - pos.y) / scale;
    const s = base * next;
    setZoom(next);
    setPos(limit({ x: VIEW / 2 - cx * s, y: VIEW / 2 - cy * s }, s));
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, start: pos };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    setPos(
      limit({
        x: drag.current.start.x + (e.clientX - drag.current.px),
        y: drag.current.start.y + (e.clientY - drag.current.py),
      }),
    );
  }
  function onPointerUp() {
    drag.current = null;
  }

  function onKeyDown(e) {
    const step = 12;
    const d = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }[e.key];
    if (!d) return;
    e.preventDefault();
    setPos((p) => limit({ x: p.x + d[0], y: p.y + d[1] }));
  }

  function reset() {
    if (!nat) return;
    const s = base;
    setZoom(1);
    setPos({ x: (VIEW - nat.w * s) / 2, y: (VIEW - nat.h * s) / 2 });
  }

  function handleSave() {
    if (!nat || busy) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    const size = VIEW / scale; // side of the visible area, in source px
    ctx.drawImage(
      imgRef.current,
      -pos.x / scale,
      -pos.y / scale,
      size,
      size,
      0,
      0,
      OUT,
      OUT,
    );
    const type = fileType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(
      (blob) => {
        if (!blob) return setFailed(true);
        const ext = type === 'image/jpeg' ? 'jpg' : 'png';
        onSave(new File([blob], `avatar.${ext}`, { type }));
      },
      type,
      0.92,
    );
  }

  return (
    <div className="py-4 flex flex-col items-start gap-3">
      <p className="text-[13px] text-text-muted">
        Drag the photo to reposition it, and use the slider to zoom.
      </p>

      <div
        tabIndex={0}
        role="group"
        aria-label="Photo position. Use the arrow keys to move the photo."
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ width: VIEW, height: VIEW, touchAction: 'none' }}
        className="relative overflow-hidden rounded-xl bg-surface-muted select-none cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40"
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={handleLoad}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: nat ? nat.w * scale : undefined,
            height: nat ? nat.h * scale : undefined,
            maxWidth: 'none',
            visibility: nat ? 'visible' : 'hidden',
          }}
        />
        {/* The circle shows what the avatar will look like; the rest is dimmed. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-white/80"
          style={{ boxShadow: '0 0 0 999px rgba(0,0,0,0.5)' }}
        />
      </div>

      <label className="flex items-center gap-3 w-full max-w-[240px] text-[13px] text-text-muted">
        Zoom
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => handleZoom(Number(e.target.value))}
          disabled={!nat}
          className="flex-1 accent-primary"
          aria-label="Zoom"
        />
      </label>

      {failed && (
        <p role="alert" className="text-[13px] text-danger">
          Couldn't read that image. Try a different one.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={primaryBtn}
          onClick={handleSave}
          disabled={!nat || busy || failed}
        >
          {busy ? 'Saving...' : 'Save photo'}
        </button>
        <button type="button" className={secondaryBtn} onClick={reset} disabled={busy || !nat}>
          Reset
        </button>
        <button type="button" className={secondaryBtn} onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PhotoAdjuster;