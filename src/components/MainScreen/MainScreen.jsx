import { useState, useRef, useEffect } from "react";
import TopBar from "../TopBar/TopBar";
import SettingsModal from "./Settings/SettingsModal";
import { nodes } from "../../apps/nodes/index";
import NodeCard from "../../apps/nodes/NodeCard";
import NodeFullScreen from "../../apps/nodes/NodeFullScreen";
import "./MainScreen.css";

const MAX_CHARS = 50;

export default function MainScreen({ onBack }) {
  const [text, setText] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [nodeOrder, setNodeOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("nodeOrder");
      return saved ? JSON.parse(saved) : nodes.map((n) => n.id);
    } catch {
      return nodes.map((n) => n.id);
    }
});
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const hideTimer = useRef(null);
  const appContainerRef = useRef(null);

  const handleMousemove = (e, nodeId) => {
    if (draggedId && draggedId !== nodeId) {
      setDragOverId(nodeId);
    }
  };

  const handleDragStart = (e, nodeId) => {
    setDraggedId(nodeId);
  };

  const handleDragEnd = (e, nodeId) => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleMouseMove = (e, nodeId) => {
    if (draggedId && draggedId !== nodeId) {
      setDragOverId(nodeId);
    }
  };

  const handleMouseDown = (e, nodeId) => {
    e.preventDefault();
    setDraggedId(nodeId);

    const startY = e.clientY || e.touches?.[0]?.clientY;
    const startX = e.clientX || e.touches?.[0]?.clientX;

    if (Math.abs(currentY - startY) > 5 || Math.abs(currentX - startX) > 5) {
      setDragOverId(nodeId);
    }
  };

  const handleMouseUpDrag = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUpDrag);
    window.removeEventListener("touchmove", handleMouseMove);
    window.removeEventListener("touchend", handleMouseUpDrag);
    setDraggedId(null);
    setDragOverId(null);
  }

  window.addEventListener("mouseup", handleMouseUpDrag);
  window.addEventListener("touchend", handleMouseUpDrag);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("touchmove", handleMouseMove);

  useEffect(() => {
    try {
      const savedGlow = localStorage.getItem("glow") || "none";
      if (appContainerRef.current) {
        appContainerRef.current.classList.add(`glow-${savedGlow}`);
      }
    } catch (e) {}
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setText(value);
    }

    setShowCounter(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCounter(false), 1000);
  };

  const activeNode = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;

  return (
    <div className="app-container" ref={appContainerRef}>
      <div className="main-screen">
        {!activeNodeId && (
          <button className="back-button" onClick={onBack}>
            <span className="back-arrow">←</span>
            Back
          </button>
        )}

        <TopBar
          text={text}
          onChange={handleChange}
          showCounter={showCounter}
          maxChars={MAX_CHARS}
          onSettingsClick={() => setShowSettings(true)}
        />

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

        <div className="main-screen-content">
          <div className="nodes-grid">
            {sortedNodes.map((node, index) => {
              const handleGridMouseEnter = (targetIndex) => {
                if (draggedId) {
                  const draggedIndex = nodeOrder.indexOf(draggedId);
                  if (draggedIndex !== targetIndex) {
                    const newOrder = [...nodeOrder];
                    newOrder.splice(draggedIndex, 1);
                    newOrder.splice(targetIndex, 0, draggedId);
                    setNodeOrder(newOrder);
                  }
                }
              };

              return (
                <div
                  key={node.id}
                  onMouseEnter={() => handleGridMouseEnter(index)}
                  className={`node-card-wrapper ${
                    draggedId === node.id ? "dragging" : ""
                  } ${dragOverId === node.id ? "drag-over" : ""}`}
                >
                  <NodeCard
                    node={node}
                    onClick={() => setActiveNodeId(node.id)}
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onDragEnd={(e) => handleDragEnd(e, node.id)}
                    isDragging={draggedId === node.id}
                  />
                </div>
              );
            })}
          </div>
        
        <div className="helios-corner">Helios</div>
        </div>

        {activeNode && (
          <NodeFullScreen
            node={activeNode}
            onClose={() => setActiveNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}