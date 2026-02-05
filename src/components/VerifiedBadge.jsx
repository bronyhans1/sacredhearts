import React from 'react';

/**
 * Verified badge — smooth scalloped edge (14 bumps), blue fill, slim white checkmark. No outline.
 */
const VIEW = 24;
const VerifiedBadge = ({ size = 'md', className = '', title = 'Verified Account' }) => {
  const sizes = { sm: 16, md: 20, lg: 24 };
  const px = sizes[size] || sizes.md;

  const cx = VIEW / 2;
  const cy = VIEW / 2;
  const n = 14; // number of scallop bumps
  const R_avg = 10;
  const A = 2.2; // wave amplitude (rounded bumps)
  const N = 2 * n;
  const twoPi = 2 * Math.PI;

  // Sample points on smooth wavy edge: r(θ) = R_avg + A*cos(n*θ)
  const points = [];
  for (let i = 0; i <= N; i++) {
    const angle = (i / N) * twoPi - Math.PI / 2;
    const r = R_avg + A * Math.cos(n * angle);
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle,
      r,
    });
  }

  // Tangent at angle (for smooth Bezier): from dr/dθ and position
  const tangent = (i) => {
    const p = points[i];
    const dr = -A * n * Math.sin(n * p.angle);
    const tx = dr * Math.cos(p.angle) - p.r * Math.sin(p.angle);
    const ty = dr * Math.sin(p.angle) + p.r * Math.cos(p.angle);
    const len = Math.hypot(tx, ty) || 1;
    const k = (twoPi / N) * 0.4;
    return { x: (tx / len) * k, y: (ty / len) * k };
  };

  let scallopPath = `M ${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`;
  for (let i = 0; i < N; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const t0 = tangent(i);
    const t1 = tangent(i + 1);
    const c1x = p0.x + t0.x;
    const c1y = p0.y + t0.y;
    const c2x = p1.x - t1.x;
    const c2y = p1.y - t1.y;
    scallopPath += ` C ${c1x.toFixed(3)} ${c1y.toFixed(3)} ${c2x.toFixed(3)} ${c2y.toFixed(3)} ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`;
  }
  scallopPath += ' Z';

  // Slim checkmark: short left arm, longer right arm, slight tilt
  const ck = 5;
  const checkPath = `M ${cx - ck * 0.85} ${cy} L ${cx - ck * 0.15} ${cy + ck * 0.55} L ${cx + ck * 0.95} ${cy - ck * 0.5}`;
  const strokeW = size === 'sm' ? 1 : 1.15;

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      title={title}
      role="img"
      aria-label={title}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        fill="none"
        className="drop-shadow-sm"
      >
        <path
          d={scallopPath}
          fill="#3B82F6"
        />
        <path
          d={checkPath}
          stroke="white"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
