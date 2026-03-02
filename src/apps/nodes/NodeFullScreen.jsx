import { motion } from 'framer-motion';
import './nodes.css';

export default function NodeFullScreen({ node, onClose }) {
  const isPeacefulDisplay = node.id === 'peacefulDisplay';

  return (
    <motion.div
      className="node-fullscreen-overlay"
      onClick={onClose}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
    >
      <motion.div
        className="node-fullscreen-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 1, scale: 1, y: 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0 }}
      >
        {!isPeacefulDisplay && (
          <div className="node-fullscreen-header">
            <div className="node-fullscreen-title-group">
              <h2>{node.title}</h2>
              {node.id === 'reflection' && (
                <button
                  className="node-fullscreen-info"
                  type="button"
                  aria-label="Mental health support information"
                >
                  <span className="node-fullscreen-info-icon" aria-hidden="true">i</span>
                  <span className="node-fullscreen-info-tooltip">
                    If you are suffering from mental health issues, do not suffer in silence and seek help, for your own good. About 720,000 people die by suicide each year.
                  </span>
                </button>
              )}
            </div>
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
            <node.component />
          </div>
      </motion.div>
    </motion.div>
  );
}