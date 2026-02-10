import { Suspense } from 'react';
import './nodes.css';

export default function NodeFullScreen({ node, onClose }) {
  const isPeacefulDisplay = node.id === 'peacefulDisplay';

  return (
    <div className="node-fullscreen-overlay" onClick={onClose}>
      <div className="node-fullscreen-container" onClick={(e) => e.stopPropagation()}>
        {!isPeacefulDisplay && (
          <div className="node-fullscreen-header">
            <h2>{node.title}</h2>
            <button className="node-fullscreen-close" onClick={onClose}>
              ✕
            </button>
          </div>
        )}
        {isPeacefulDisplay && (
          <button
            className="node-fullscreen-close node-fullscreen-close-floating"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        )}
        <div className="node-fullscreen-content">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <node.component />
          </Suspense>
        </div>
      </div>
    </div>
  );
}