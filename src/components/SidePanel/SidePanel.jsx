import { useEffect, useState } from "react";
import "./SidePanel.css";

export default function SidePanel({ state, onToggle, onHover, onQuickAddTodo, subheadings }) {
    useEffect(() => {
        if (state === 'expanded') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [state]);

    const [quickInput, setQuickInput] = useState("");
    const [selectedSubheadingId, setSelectedSubheadingId] = useState("inbox-default");
    const [dueDate, setDueDate] = useState("");
    const [buttonState, setButtonState] = useState("idle"); // idle, success

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
        <button
            className="side-panel__tab"
            onClick={onToggle}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            aria-label="Toggle side panel"
        >
            <span className="side-panel__tab-icon">
                {state === 'expanded' ? '«' : '»'}
            </span>
        </button>

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
                    <div className="side-panel__placeholder">
                        <p>No active session</p>
                    </div>
                </div>

                <div className="side-panel__section">
                    <h3 className="side-panel__section-title">Next</h3>
                    <div className="side-panel__placeholder">
                        <p>Nothing scheduled</p>
                    </div>
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

                    <button 
                        className={`side-panel__add-btn ${buttonState === "success" ? "side-panel__add-btn--success" : ""}`}
                        onClick={handleQuickSubmit}
                        disabled={buttonState === "success"}
                    >
                        {buttonState === "success" ? "Added! ✓" : "Add to Inbox"}
                    </button>
                </div>
            </div>
        </div>
    </div>
    );
}