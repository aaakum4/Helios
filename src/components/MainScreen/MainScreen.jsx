import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../TopBar/TopBar";
import SettingsModal from "./Settings/SettingsModal";
import { nodes } from "../../apps/nodes/index";
import NodeCard from "../../apps/nodes/NodeCard";
import NodeFullScreen from "../../apps/nodes/NodeFullScreen";
import SidePanel from "../SidePanel/SidePanel";
import { useLocalStorage } from "../../core/useLocalStorage";
import { createId } from "../../core/idGenerator";
import { useTimeOfDay } from "../../core/TimeProvider";
import WaveBackground from "../WaveBackground/WaveBackground";
import GeometricLayer from "../GeometricLayer/GeometricLayer";
import "./MainScreen.css";

const MAX_CHARS = 50;

function isEditableTarget(target) {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  return target.isContentEditable;
}

function getShortcutDigit(event) {
  if (event.code && /^Digit[1-9]$/.test(event.code)) {
    return Number(event.code.replace("Digit", ""));
  }

  if (/^[1-9]$/.test(event.key)) {
    return Number(event.key);
  }

  return null;
}

export default function MainScreen({ onBack }) {
  const [text, setText] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddDueDate, setQuickAddDueDate] = useState("");
  const [quickAddSubheadingId, setQuickAddSubheadingId] = useState("inbox-default");
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
  const quickAddInputRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastSwapTargetRef = useRef(null);

  // Live state for card badges
  const [pomodoroIsRunning] = useLocalStorage('pomodoro:isRunning', false);
  const [pomodoroIsWorkSession] = useLocalStorage('pomodoro:isWorkSession', true);

  // Must declare todosData before getLiveState uses it
  const [todosData, setTodosData] = useLocalStorage("todosData", {
    subheadings: [
      {
        id: "inbox-default",
        title: "Inbox",
        todos: [],
      },
    ],
  });

  useEffect(() => {
    try {
      localStorage.setItem("nodeOrder", JSON.stringify(nodeOrder));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[main-screen] Unable to persist node order.", error);
      }
    }
  }, [nodeOrder]);

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    if (panelState === "expanded") {
      return;
    }

    e.stopPropagation();
    setDraggedId(nodeId);
    isDraggingRef.current = false;
    lastSwapTargetRef.current = null;

    const startY = e.clientY || e.touches?.[0]?.clientY;
    const startX = e.clientX || e.touches?.[0]?.clientX;

    const handleMouseMoveDrag = (moveEvent) => {
      const currentY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;
      const currentX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX;

      if (Math.abs(currentY - startY) > 5 || Math.abs(currentX - startX) > 5) {
        isDraggingRef.current = true;

        const targetElement = document
          .elementFromPoint(currentX, currentY)
          ?.closest("[data-node-id]");
        const targetNodeId = targetElement?.getAttribute("data-node-id");

        if (!targetNodeId || targetNodeId === nodeId) {
          setDragOverId(null);
          lastSwapTargetRef.current = null;
          return;
        }

        setDragOverId(targetNodeId);

        if (lastSwapTargetRef.current === targetNodeId) {
          return;
        }

        setNodeOrder((prevOrder) => {
          const fromIndex = prevOrder.indexOf(nodeId);
          const toIndex = prevOrder.indexOf(targetNodeId);

          if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            return prevOrder;
          }

          const nextOrder = [...prevOrder];
          [nextOrder[fromIndex], nextOrder[toIndex]] = [nextOrder[toIndex], nextOrder[fromIndex]];
          return nextOrder;
        });

        lastSwapTargetRef.current = targetNodeId;
      }
    };

    const handleMouseUpDrag = () => {
      window.removeEventListener("mousemove", handleMouseMoveDrag);
      window.removeEventListener("mouseup", handleMouseUpDrag);
      window.removeEventListener("touchmove", handleMouseMoveDrag);
      window.removeEventListener("touchend", handleMouseUpDrag);
      setDraggedId(null);
      setDragOverId(null);
      lastSwapTargetRef.current = null;
      
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    };

    window.addEventListener("mousemove", handleMouseMoveDrag);
    window.addEventListener("mouseup", handleMouseUpDrag);
    window.addEventListener("touchmove", handleMouseMoveDrag);
    window.addEventListener("touchend", handleMouseUpDrag);
  }, [panelState]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setText(value);
    }

    setShowCounter(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCounter(false), 1000);
  }, []);

  const handlePanelToggle = useCallback(() => {
    setPanelState((prev) => (prev === 'expanded' ? 'hidden' : 'expanded'));
  }, []);

  // Memoize sorted nodes to prevent recalculation on every render
  const sortedNodes = useMemo(() => 
    nodeOrder.map((id) => nodes.find((n) => n.id === id)).filter(Boolean),
    [nodeOrder]
  );

  const activeNode = useMemo(() => 
    activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null,
    [activeNodeId]
  );

  const closeActiveNode = useCallback((reason = "node_closed") => {
    if (!activeNodeId) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("helios:cloud-save-request", {
        detail: { reason },
      })
    );
    setActiveNodeId(null);
  }, [activeNodeId]);

  const getLiveState = useCallback((nodeId) => {
    if (nodeId === 'pomodoro' && pomodoroIsRunning) {
      return pomodoroIsWorkSession ? 'Focus · Running' : 'Break · Running';
    }
    if (nodeId === 'todo') {
      const _td = new Date();
      const todayStr = `${_td.getFullYear()}-${String(_td.getMonth() + 1).padStart(2, '0')}-${String(_td.getDate()).padStart(2, '0')}`;
      const dueTodayCount = (todosData?.subheadings ?? [])
        .flatMap((s) => s.todos ?? [])
        .filter((t) => !t.completed && t.dueDate === todayStr).length;
      if (dueTodayCount > 0) return `${dueTodayCount} due today`;
    }
    return null;
  }, [pomodoroIsRunning, pomodoroIsWorkSession, todosData]);

  // Use optimized time-of-day hook that only updates when hour changes
  const timeOfDay = useTimeOfDay();

  const handleQuickAddTodo = useCallback((title, subheadingId = "inbox-default", dueDate = "") => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    const newTodo = {
      id: `todo-${createId()}`,
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
  }, [setTodosData]);

  const openQuickAddModal = useCallback(() => {
    setQuickAddTitle("");
    setQuickAddDueDate("");
    setQuickAddSubheadingId("inbox-default");
    setShowQuickAddModal(true);
  }, []);

  const closeQuickAddModal = useCallback(() => {
    setShowQuickAddModal(false);
  }, []);

  const submitQuickAddModal = useCallback(() => {
    const trimmed = quickAddTitle.trim();
    if (!trimmed) {
      return;
    }

    handleQuickAddTodo(trimmed, quickAddSubheadingId || "inbox-default", quickAddDueDate);
    setShowQuickAddModal(false);
    setActiveNodeId("todo");
    window.posthog?.capture("todo_quick_add_shortcut", {
      has_due_date: Boolean(quickAddDueDate),
      subheading_id: quickAddSubheadingId || "inbox-default",
    });
  }, [handleQuickAddTodo, quickAddDueDate, quickAddSubheadingId, quickAddTitle]);

  useEffect(() => {
    if (!showQuickAddModal) {
      return;
    }

    const timeoutId = setTimeout(() => {
      quickAddInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [showQuickAddModal]);

  useEffect(() => {
    const handleGlobalShortcuts = (event) => {
      const hasCommandModifier = event.metaKey || event.ctrlKey;
      const editable = isEditableTarget(event.target);

      if (event.key === "Escape") {
        if (showQuickAddModal) {
          event.preventDefault();
          closeQuickAddModal();
          return;
        }

        if (showSettings) {
          event.preventDefault();
          setShowSettings(false);
          return;
        }

        if (activeNodeId) {
          event.preventDefault();
          closeActiveNode("node_closed_escape");
          return;
        }

        if (panelState === "expanded") {
          event.preventDefault();
          setPanelState("hidden");
        }
        return;
      }

      if (hasCommandModifier && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        openQuickAddModal();
        return;
      }

      if (!hasCommandModifier || editable) {
        return;
      }

      if (event.key === ",") {
        event.preventDefault();
        setShowSettings(true);
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        handlePanelToggle();
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        setActiveNodeId("todo");
        return;
      }

      const digit = getShortcutDigit(event);
      if (!digit) {
        return;
      }

      const targetNode = sortedNodes[digit - 1];
      if (!targetNode) {
        return;
      }

      event.preventDefault();
      setActiveNodeId(targetNode.id);
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [
    activeNodeId,
    closeActiveNode,
    closeQuickAddModal,
    handlePanelToggle,
    openQuickAddModal,
    panelState,
    showQuickAddModal,
    showSettings,
    sortedNodes,
  ]);

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="back-arrow"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
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

        {showQuickAddModal && (
          <div className="quick-add-backdrop" onClick={closeQuickAddModal}>
            <div className="quick-add-modal" onClick={(event) => event.stopPropagation()}>
              <h3>Quick Add Todo</h3>
              <input
                ref={quickAddInputRef}
                type="text"
                className="quick-add-input"
                placeholder="Todo title"
                value={quickAddTitle}
                onChange={(event) => setQuickAddTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitQuickAddModal();
                  }
                }}
              />
              <div className="quick-add-row">
                <input
                  type="date"
                  className="quick-add-date"
                  value={quickAddDueDate}
                  onChange={(event) => setQuickAddDueDate(event.target.value)}
                />
                <select
                  className="quick-add-select"
                  value={quickAddSubheadingId}
                  onChange={(event) => setQuickAddSubheadingId(event.target.value)}
                >
                  {(Array.isArray(todosData?.subheadings) ? todosData.subheadings : []).map((subheading) => (
                    <option key={subheading.id} value={subheading.id}>
                      {subheading.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="quick-add-actions">
                <button type="button" className="quick-add-cancel" onClick={closeQuickAddModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="quick-add-submit"
                  onClick={submitQuickAddModal}
                  disabled={!quickAddTitle.trim()}
                >
                  Add Todo
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="main-screen-content" data-panel-state={panelState}>
          <div className="nodes-container">
            <motion.div
              className="nodes-grid"
              data-dragging={draggedId ? "true" : "false"}
            >
              {sortedNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  layout="position"
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 280,
                      damping: 25,
                      mass: 0.85,
                    },
                  }}
                  data-node-id={node.id}
                  className={
                    draggedId === node.id
                      ? "node-card-wrapper dragging"
                      : dragOverId === node.id
                      ? "node-card-wrapper drag-over"
                      : "node-card-wrapper"
                  }
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
                </motion.div>
              ))}
            </motion.div>
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
              onClose={() => closeActiveNode("node_closed_overlay")}
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