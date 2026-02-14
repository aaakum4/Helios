import {useEffect } from "react";
import "./SidePanel.css";

export default function SidePanel({ state, onToggle, onHover }) {
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
                <h2 className="side-panel__title">Context</h2>
                <button
                    className="side-panel__close"
                    onClick={onToggle}
                    aria-label="Close panel"
                >
                    x
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
                <h3 className="side-panel__section-title">Details</h3>
                <div className="side-panel__placeholder">
                    <p>Context information will appear here</p>
                </div>
            </div>

            <div className="side-panel__section side-panel__section--inbox">
                <h3 className="side-panel__section-title">Quick add to inbox</h3>
                <textarea
                    className="side-panel__quick-input"
                    placeholder="Type something to add to your inbox..."
                    rows="3"
                />
                <button className="side-panel__add-btn">Add to inbox</button>
            </div>
        </div>
    </div>
</div>
);
}