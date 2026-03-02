import { motion } from 'framer-motion';
import './nodes.css';

const cardSpring = { type: "spring", stiffness: 300, damping: 20 };

export default function NodeCard({ node, onClick, onDragStart, isDragging, liveState }) {
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
        􀧐
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