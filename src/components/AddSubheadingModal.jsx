import {useRef, useEffect, useState} from 'react';
import './AddSubheadingModal.css';

export default function AddSubheadingModal({ onClose, onConfirm }) {
    const [title, setTitle] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleConfirm = () => {
        if (title.trim()) {
            onConfirm(title.trim());
            setTitle('');
        }
    };

    const handleKeyDown =(e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="add-subheading-backdrop" onClick={onClose}>
            <div className="add-subheading-modal" onClick={(e) => e.stopPropagation()}>
                <h2>New Subheading</h2>
                <input
                    ref={inputRef}
                    type="text"
                    className="subheading-input"
                    placeholder="Enter subheading name..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-confirm"
                        onClick={handleConfirm}
                        disabled={!title.trim()}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}