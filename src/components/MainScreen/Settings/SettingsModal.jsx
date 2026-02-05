import "./SettingsModal.css";

export default function SettingsModal({ onClose }) {
    return (
        <div className="settings-backdrop" onClick={onClose}>
            <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation ()} 
        >
            <h2>Settings</h2>

            <div className="settings-section">
                <label>
                    App theme
                    </label>
                    <select>
                        <option>Light</option>
                        <option>Dark</option>
                    </select>
            </div>

            <button className="settings-close" onClick={onClose}>
            </button>
        </div>
    </div>
    );
}