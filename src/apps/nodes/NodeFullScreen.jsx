import { Suspense } from 'react';
import './nodes.css';

export default function NodeFullScreen({ node, onClose }) {
  return (
    <div className="node-fullscreen-overlay" onClick={onClose}>
      <div className="node-fullscreen-container" onClick={(e) => e.stopPropagation()}>
        <div className="node-fullscreen-header">
          <h2>{node.title}</h2>
          <button className="node-fullscreen-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="node-fullscreen-content">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <node.component />
          </Suspense>
        </div>
      </div>
    </div>
  );
}