import './nodes.css';

export default function NodeCard({ node, onClick }) {
  return (
    <div className="node-card" onClick={onClick}>
      <div className="node-card-icon">{node.icon}</div>
      <h3 className="node-card-title">{node.title}</h3>
      <p className="node-card-description">{node.description}</p>
      <button className="node-card-button">Open</button>
    </div>
  );
}