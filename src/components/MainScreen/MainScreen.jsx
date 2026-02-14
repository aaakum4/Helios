import { useState, useRef, useEffect } from "react";
import TopBar from "../TopBar/TopBar";
import SettingsModal from "./Settings/SettingsModal";
import { nodes } from "../../apps/nodes/index";
import NodeCard from "../../apps/nodes/NodeCard";
import NodeFullScreen from "../../apps/nodes/NodeFullScreen";
import SidePanel from "../SidePanel/SidePanel";
import "./MainScreen.css";

const MAX_CHARS = 50;

export default function MainScreen({ onBack }) {
  const [text, setText] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [panelState, setPanelState] = useState('hidden');
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
  const isDraggingRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem("nodeOrder", JSON.stringify(nodeOrder));
    } catch (e) {}
  }, [nodeOrder]);

  useEffect(() => {
    try {
      const savedGlow = localStorage.getItem("glow") || "none";
      if (appContainerRef.current) {
        appContainerRef.current.classList.add(`glow-${savedGlow}`);
      }
    } catch (e) {}
  }, []);

  const handleNodeMouseDown = (e, nodeId) => {
    if (panelState === "expanded") {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setDraggedId(nodeId);
    isDraggingRef.current = false;

    const startY = e.clientY || e.touches?.[0]?.clientY;
    const startX = e.clientX || e.touches?.[0]?.clientX;

    const handleMouseMoveDrag = (moveEvent) => {
      const currentY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;
      const currentX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX;

      if (Math.abs(currentY - startY) > 5 || Math.abs(currentX - startX) > 5) {
        isDraggingRef.current = true;
        setDragOverId(nodeId);
      }
    };

    const handleMouseUpDrag = () => {
      window.removeEventListener("mousemove", handleMouseMoveDrag);
      window.removeEventListener("mouseup", handleMouseUpDrag);
      window.removeEventListener("touchmove", handleMouseMoveDrag);
      window.removeEventListener("touchend", handleMouseUpDrag);
      setDraggedId(null);
      setDragOverId(null);
      
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    };

    window.addEventListener("mousemove", handleMouseMoveDrag);
    window.addEventListener("mouseup", handleMouseUpDrag);
    window.addEventListener("touchmove", handleMouseMoveDrag);
    window.addEventListener("touchend", handleMouseUpDrag);
  };

  const handleNodeMouseEnter = (nodeId) => {
    if (panelState === "expanded") {
      return;
    }

    if (!draggedId || draggedId === nodeId) {
      return;
    }

    setNodeOrder((prevOrder) => {
      const fromIndex = prevOrder.indexOf(draggedId);
      const toIndex = prevOrder.indexOf(nodeId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prevOrder;
      }

      const nextOrder = [...prevOrder];
      nextOrder.splice(fromIndex, 1);
      nextOrder.splice(toIndex, 0, draggedId);
      return nextOrder;
    });

    setDragOverId(nodeId);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setText(value);
    }

    setShowCounter(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCounter(false), 1000);
  };

  const handlePanelToggle = () => {
    setPanelState((prev) => (prev === 'expanded' ? 'hidden' : 'expanded'));
  };
  
  const handlePanelHover = (isHovering) => {
    if (panelState === 'hidden' && isHovering) {
      setPanelState('peek');
    } else if (panelState === 'peek' && !isHovering) {
      setPanelState('hidden');
    }
  };

  const sortedNodes = nodeOrder
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean);

  const activeNode = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;

  return (
    <div className="app-container" ref={appContainerRef}>
      <div className="main-screen">
        {!activeNodeId && (
            <button
              className={
                panelState === "expanded"
                  ? "back-button back-button--hidden"
                  : "back-button"
              }
              onClick={onBack}
            >
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

        <div className="main-screen-content" data-panel-state={panelState}>
          <div className="nodes-container">
            <div className="nodes-grid">
              {sortedNodes.map((node) => (
                <div
                  key={node.id}
                  className={
                    draggedId === node.id
                      ? "node-card-wrapper dragging"
                      : dragOverId === node.id
                      ? "node-card-wrapper drag-over"
                      : "node-card-wrapper"
                  }
                  onMouseEnter={() => handleNodeMouseEnter(node.id)}
                  onTouchMove={() => handleNodeMouseEnter(node.id)}
                >
                  <NodeCard
                    node={node}
                    onClick={() => {
                      if (!isDraggingRef.current) {
                        setActiveNodeId(node.id);
                      }
                    }}
                    onDragStart={(e) => handleNodeMouseDown(e, node.id)}
                    isDragging={draggedId === node.id}
                  />
                </div>
              ))}
            </div>
          </div>

          <SidePanel
            state={panelState}
            onToggle={handlePanelToggle}
            onHover={handlePanelHover}
          />
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