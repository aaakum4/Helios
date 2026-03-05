import { memo } from "react";
import "./WaveBackground.css";

/**
 * WaveBackground
 *
 * Three layered SVG waves anchored to the bottom of the screen.
 * All fills derive from --accent so they adapt to every palette
 * automatically. Opacity varies per layer (darkest → bottom,
 * lightest → top). A slow horizontal drift loops seamlessly.
 *
 * The SVG is 200 % wide (2880 viewBox units, period = 720 units × 4).
 * Animating translateX(0 → -50 %) shifts exactly one full tile and
 * loops with no seam.
 *
 * Memoized to prevent re-renders.
 */
function WaveBackground() {
  return (
    <div className="wave-bg" aria-hidden="true">
      {/* ── Layer 1 – bottom / darkest ── */}
      <svg
        className="wave-svg wave-svg--1"
        viewBox="0 0 2880 180"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M0,72
            C240,36 480,108 720,72
            C960,36 1200,108 1440,72
            C1680,36 1920,108 2160,72
            C2400,36 2640,108 2880,72
            L2880,180 L0,180 Z
          "
          fill="var(--accent)"
        />
      </svg>

      {/* ── Layer 2 – middle ── */}
      <svg
        className="wave-svg wave-svg--2"
        viewBox="0 0 2880 180"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M0,112
            C240,90 480,134 720,112
            C960,90 1200,134 1440,112
            C1680,90 1920,134 2160,112
            C2400,90 2640,134 2880,112
            L2880,180 L0,180 Z
          "
          fill="var(--accent)"
        />
      </svg>

      {/* ── Layer 3 – top / lightest ── */}
      <svg
        className="wave-svg wave-svg--3"
        viewBox="0 0 2880 180"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M0,147
            C240,133 480,161 720,147
            C960,133 1200,161 1440,147
            C1680,133 1920,161 2160,147
            C2400,133 2640,161 2880,147
            L2880,180 L0,180 Z
          "
          fill="var(--accent)"
        />
      </svg>
    </div>
  );
}

export default memo(WaveBackground);
