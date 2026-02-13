import './nodes.css';

export default function NodeCard({ node, onClick, onDragStart, isDragging }) {
  return (
    <div className="node-card" onClick={onClick}>
      <button
        className="node-move-button"
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        title="Drag to reorder"
      >
        ⋮⋮
      </button>
      <div className="node-card-icon">{node.icon}</div>
      <h3 className="node-card-title">{node.title}</h3>
      <p className="node-card-description">{node.description}</p>
      <button className="node-card-button">Open</button>
    </div>
  );
}