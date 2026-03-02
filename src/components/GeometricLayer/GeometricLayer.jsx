import "./GeometricLayer.css";

/**
 * GeometricLayer
 *
 * Three large, low-opacity geometric shapes anchored to the layout.
 * They use --accent for color and --geo-opacity (set per time-of-day
 * in CSS) to stay embedded in the atmosphere rather than floating on top.
 *
 * Shapes:
 *  1. Large rounded hexagon — top-right corner
 *  2. Rotated soft square   — bottom-left, behind cards
 *  3. Oversized circle      — bottom-right, bleeds off-screen
 */
export default function GeometricLayer({ tod }) {
  return (
    <div className="geo-layer" data-tod={tod} aria-hidden="true">
      {/* ── Shape 1: rounded hexagon, top-right ── */}
      <svg
        className="geo-shape geo-shape--hex"
        viewBox="0 0 200 230"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="100,10 190,57.5 190,172.5 100,220 10,172.5 10,57.5"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinejoin="round"
        />
      </svg>

      {/* ── Shape 2: rotated soft square, top-middle-left ── */}
      <svg
        className="geo-shape geo-shape--square"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="20"
          y="20"
          width="160"
          height="160"
          rx="28"
          ry="28"
          fill="var(--accent)"
          stroke="none"
        />
      </svg>
    </div>
  );
}
