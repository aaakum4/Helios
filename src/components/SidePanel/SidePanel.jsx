import { useMemo, useState } from "react";
import { motion } from 'framer-motion';
import { useTime } from "../../core/TimeProvider";
import { useAppContext } from "../../core/AppContext";
import "./SidePanel.css";

export default function SidePanel({ state, onToggle, onQuickAddTodo, subheadings }) {
    const [quickInput, setQuickInput] = useState("");
    const [selectedSubheadingId, setSelectedSubheadingId] = useState("inbox-default");
    const [dueDate, setDueDate] = useState("");
    const [buttonState, setButtonState] = useState("idle"); // idle, success
    const { time } = useTime();
    const {
        timetableBlocks,
        rotationMode,
        activeWeekIndex,
        activeMonthWeek,
    } = useAppContext();

    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const formatMinutes = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const suffix = h >= 12 ? "PM" : "AM";
        const h12 = ((h + 11) % 12) + 1;
        return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
    };

    const matchesRotation = (block) => {
        if (block.rotation !== rotationMode) {
            return false;
        }
        if (rotationMode === "fortnightly") {
            return block.weekIndex === activeWeekIndex;
        }
        if (rotationMode === "monthly") {
            return block.monthWeekIndex === activeMonthWeek;
        }
        return true;
    };

    const { currentBlock, nextBlock } = useMemo(() => {
        const visibleBlocks = (timetableBlocks || []).filter(matchesRotation);
        if (!time || visibleBlocks.length === 0) {
            return { currentBlock: null, nextBlock: null };
        }

        const todayIndex = time.getDay();
        const nowMinutes = time.getHours() * 60 + time.getMinutes();

        let active = null;
        for (const block of visibleBlocks) {
            if (block.dayIndex !== todayIndex) {
                continue;
            }
            if (block.startMinutes <= nowMinutes && nowMinutes < block.endMinutes) {
                if (!active || block.startMinutes < active.startMinutes) {
                    active = block;
                }
            }
        }

        let upcoming = null;
        for (const block of visibleBlocks) {
            const dayDistance = (block.dayIndex - todayIndex + 7) % 7;
            if (dayDistance === 0 && block.startMinutes <= nowMinutes) {
                continue;
            }
            if (!upcoming) {
                upcoming = block;
                continue;
            }
            const upcomingDistance = (upcoming.dayIndex - todayIndex + 7) % 7;
            if (dayDistance < upcomingDistance) {
                upcoming = block;
                continue;
            }
            if (dayDistance === upcomingDistance && block.startMinutes < upcoming.startMinutes) {
                upcoming = block;
            }
        }

        return { currentBlock: active, nextBlock: upcoming };
    }, [timetableBlocks, rotationMode, activeWeekIndex, activeMonthWeek, time]);

    const handleQuickSubmit = () => {
        if (onQuickAddTodo && quickInput.trim()) {
            onQuickAddTodo(quickInput, selectedSubheadingId, dueDate);
            setQuickInput("");
            setDueDate("");
            setButtonState("success");
            setTimeout(() => {
                setButtonState("idle");
            }, 2000);
        }
    };

return (
    <div className={`side-panel side-panel--${state}`}>
        <motion.button
            className="side-panel__tab"
            onClick={onToggle}
            aria-label="Toggle side panel"
            whileHover={{ 
                scale: 1.15, 
                x: state === 'expanded' ? 6 : 0, 
                y: -3,
                rotate: state === 'expanded' ? -3 : 2
            }}
            whileTap={{ 
                scale: 0.92, 
                x: state === 'expanded' ? 2 : 0,
                y: 0,
                rotate: 0
            }}
            transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                mass: 0.8
            }}
        >
            <span className="side-panel__tab-icon">
                {state === 'expanded' ? '«' : '»'}
            </span>
            <div className="side-panel__tab-glow"></div>
            <div className="side-panel__tab-particles">
                <span className="particle particle-1"></span>
                <span className="particle particle-2"></span>
                <span className="particle particle-3"></span>
            </div>
        </motion.button>

                <div className="side-panel__content">
            <div className="side-panel__header">
                <h2 className="side-panel__title">On now</h2>
                <button
                    className="side-panel__close"
                    onClick={onToggle}
                    aria-label="Close panel"
                >
                    ✕
                </button>
            </div>
        
            <div className="side-panel__body">
                <div className="side-panel__section">
                    <h3 className="side-panel__section-title">Currently</h3>
                    {currentBlock ? (
                        <div className="side-panel__session" style={{ borderColor: currentBlock.color }}>
                            <div className="side-panel__session-title">{currentBlock.title}</div>
                            <div className="side-panel__session-time">
                                {DAYS[currentBlock.dayIndex]} • {formatMinutes(currentBlock.startMinutes)} - {formatMinutes(currentBlock.endMinutes)}
                            </div>
                        </div>
                    ) : (
                        <div className="side-panel__placeholder">
                            <p>Nothing on now.</p>
                        </div>
                    )}
                </div>

                <div className="side-panel__section">
                    <h3 className="side-panel__section-title">Next</h3>
                    {nextBlock ? (
                        <div className="side-panel__session" style={{ borderColor: nextBlock.color }}>
                            <div className="side-panel__session-title">{nextBlock.title}</div>
                            <div className="side-panel__session-time">
                                {DAYS[nextBlock.dayIndex]} • {formatMinutes(nextBlock.startMinutes)} - {formatMinutes(nextBlock.endMinutes)}
                            </div>
                        </div>
                    ) : (
                        <div className="side-panel__placeholder">
                            <p>Nothing coming up.</p>
                        </div>
                    )}
                </div>

                <div className="side-panel__section side-panel__section--inbox">
                    <h3 className="side-panel__section-title">Quick add to inbox</h3>
                    <textarea
                        className="side-panel__quick-input"
                        placeholder="Type something to add to your inbox..."
                        rows="3"
                        value={quickInput}
                        onChange={(e) => setQuickInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleQuickSubmit();
                            }
                        }}
                    />

                    <div className="side-panel__options">
                        <div className="side-panel__option-group">
                            <label className="side-panel__option-label">Due Date</label>
                            <input
                                type="date"
                                className="side-panel__date-input"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div className="side-panel__option-group">
                            <label className="side-panel__option-label">Add to</label>
                            <select
                                className="side-panel__subheading-select"
                                value={selectedSubheadingId}
                                onChange={(e) => setSelectedSubheadingId(e.target.value)}
                            >
                                {subheadings.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.title}
                                    </option>
                                ))}
                    </select>
                        </div>
                    </div>

                    <motion.button 
                        className={`side-panel__add-btn ${buttonState === "success" ? "side-panel__add-btn--success" : ""}`}
                        onClick={handleQuickSubmit}
                        disabled={buttonState === "success"}
                        whileHover={buttonState !== "success" ? { y: -2, scale: 1.01 } : {}}
                        whileTap={buttonState !== "success" ? { scale: 0.97, y: 0 } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {buttonState === "success" ? "Added! ✓" : "Add to Inbox"}
                    </motion.button>
                </div>
            </div>
        </div>
    </div>
    );
}