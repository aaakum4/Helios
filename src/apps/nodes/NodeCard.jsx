import React, { memo } from 'react';
import { motion } from 'framer-motion';
import './nodes.css';

const cardSpring = { type: "spring", stiffness: 300, damping: 20 };

// Memoized to prevent unnecessary re-renders when parent updates
function NodeCard({ node, onClick, onDragStart, isDragging, liveState }) {
  return (
    <motion.div
      className="node-card"
      onClick={onClick}
      whileHover={isDragging ? {} : { y: -6, rotate: 1, scale: 1.02 }}
      whileTap={isDragging ? {} : { scale: 0.97, rotate: 0 }}
      transition={cardSpring}
    >
      <button
        className="node-move-button"
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        title="Drag to reorder"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-move-icon lucide-move"><path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/></svg>
      </button>
      {liveState && (
        <span className="card-status-badge">{liveState}</span>
      )}
      <div className="node-card-icon">{node.icon}</div>
      <h3 className="node-card-title">{node.title}</h3>
      <p className="node-card-description">{node.description}</p>
      <button className="node-card-button">Open</button>
    </motion.div>
  );
}

export default memo(NodeCard);