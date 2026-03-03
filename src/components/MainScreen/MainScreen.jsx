import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../TopBar/TopBar";
import SettingsModal from "./Settings/SettingsModal";
import { nodes } from "../../apps/nodes/index";
import NodeCard from "../../apps/nodes/NodeCard";
import NodeFullScreen from "../../apps/nodes/NodeFullScreen";
import SidePanel from "../SidePanel/SidePanel";
import { useLocalStorage } from "../../core/useLocalStorage";
import { useTime } from "../../core/TimeProvider";
import WaveBackground from "../WaveBackground/WaveBackground";
import GeometricLayer from "../GeometricLayer/GeometricLayer";
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
  const isDraggingRef = useRef(false);

  // Live state for card badges
  const [pomodoroIsRunning] = useLocalStorage('pomodoro:isRunning', false);
  const [pomodoroIsWorkSession] = useLocalStorage('pomodoro:isWorkSession', true);

  useEffect(() => {
    try {
      localStorage.setItem("nodeOrder", JSON.stringify(nodeOrder));
    } catch (e) {}
  }, [nodeOrder]);

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

  const sortedNodes = nodeOrder
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean);

  const activeNode = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;

  const getLiveState = (nodeId) => {
    if (nodeId === 'pomodoro' && pomodoroIsRunning) {
      return pomodoroIsWorkSession ? 'Focus · Running' : 'Break · Running';
    }
    if (nodeId === 'todo') {
      const todayStr = new Date().toISOString().slice(0, 10);
      const dueTodayCount = (todosData?.subheadings ?? [])
        .flatMap((s) => s.todos ?? [])
        .filter((t) => !t.completed && t.dueDate === todayStr).length;
      if (dueTodayCount > 0) return `${dueTodayCount} due today`;
    }
    return null;
  };

  const { time } = useTime();
  const timeOfDay = (() => {
    const h = time.getHours();
    if (h >= 4 && h < 8)  return 'dawn';
    if (h >= 8 && h < 12) return 'morning';
    if (h >= 12 && h < 16) return 'midday';
    if (h >= 16 && h < 20) return 'evening';
    return 'night';
  })();

  const [todosData, setTodosData] = useLocalStorage("todosData", {
    subheadings: [
      {
        id: "inbox-default",
        title: "Inbox",
        todos: [],
      },
    ],
  });

  const handleQuickAddTodo = (title, subheadingId = "inbox-default", dueDate = "") => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    const newTodo = {
      id: `todo-${Date.now()}`,
      title: trimmed,
      completed: false,
      dueDate: dueDate || "",
    };

    setTodosData((prev) => {
      const existingSubheadings = Array.isArray(prev.subheadings)
        ? prev.subheadings
        : [];
      
      let targetIndex = existingSubheadings.findIndex(
        (s) => s.id === subheadingId
      );

      if (targetIndex === -1) {
        targetIndex = existingSubheadings.findIndex(
          (s) => s.id === "inbox-default"
        );

        if (targetIndex === -1) {
          return {
            ...prev, 
            subheadings: [
              {
                id: "inbox-default",
                title: "Inbox",
                todos: [newTodo],
              },
              ...existingSubheadings,
            ],
          };
        }
      }

      const nextSubheadings = [...existingSubheadings];
      const target = nextSubheadings[targetIndex];
      const targetTodos = Array.isArray(target?.todos) ? target.todos : [];
      nextSubheadings[targetIndex] = {
        ...target,
        todos: [newTodo, ...targetTodos],
      };

      return {
        ...prev,
        subheadings: nextSubheadings,
      };
    });
  };

  return (
    <div className="app-container">
      <div className="main-screen" data-tod={timeOfDay}>
        {!activeNodeId && (
            <motion.button
              className={
                panelState === "expanded"
                  ? "back-button back-button--hidden"
                  : "back-button"
              }
              onClick={onBack}
              whileHover={{ x: -3, scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 340, damping: 22 }}
            >
            <span className="back-arrow">←</span>
            Back
          </motion.button>
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
              {sortedNodes.map((node, index) => (
                <div
                  key={node.id}
                  style={{ '--card-index': index }}
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
                    liveState={getLiveState(node.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <SidePanel
            state={panelState}
            onToggle={handlePanelToggle}
            onQuickAddTodo={handleQuickAddTodo}
            subheadings={todosData.subheadings}
          />
        </div>

        <AnimatePresence>
          {activeNode && (
            <NodeFullScreen
              key={activeNode.id}
              node={activeNode}
              onClose={() => setActiveNodeId(null)}
            />
          )}
        </AnimatePresence>

        {/* Geometric depth layer — large shapes, very low opacity */}
        <GeometricLayer tod={timeOfDay} />

        {/* Wave background — sits at bottom, pointer-events: none */}
        <WaveBackground />

        {/* Atmospheric overlays — pointer-events: none so they never block interaction */}
        <div className="ambient-layer" />
        <div className="vignette-overlay" />
        <div className="grain-overlay" />
      </div>
    </div>
  );
}