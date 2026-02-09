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
  const hideTimer = useRef(null);
  const appContainerRef = useRef(null);

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
            {nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                onClick={() => setActiveNodeId(node.id)}
              />
            ))}
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