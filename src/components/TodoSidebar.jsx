import { Plus, X } from 'lucide-react';
import './TodoSidebar.css';

export default function TodoSidebar({
    subheadings,
    selectedSubheadingID,
    onSelectSubheading,
    onAddSubheadingClick,
    onDeleteSubheading,
}) {
    const handleDeleteClick = (e, subheadingID) => {
        e.stopPropagation();
        if (window.confirm('Delete this subheading and all its todos?')) {
            onDeleteSubheading(subheadingID);
        }
    };

    return (
        <div className="todo-sidebar">
            <button className="sidebar-add-btn" onClick={onAddSubheadingClick} title="Add new subheading">
                <Plus size={20} />
            </button>

            <div className="sidebar-divider"></div>

            <div className="subheadings-list">
                {subheadings.map((subheading) => (
                    <div key={subheading.id} className="subheading-item">
                        <button
                            className={`subheading-button ${
                                selectedSubheadingID === subheading.id ? 'active' : ''
                            }`}
                            onClick={() => onSelectSubheading(subheading.id)}
                        >
                            <span className="subheading-title">{subheading.title}</span>
                            <span className="todo-count">{subheading.todos.length}</span>
                        </button>
                        <button
                            className="subheading-delete-btn"
                            onClick={(e) => handleDeleteClick(e, subheading.id)}
                            title="Delete subheading"
                            aria-label={`Delete ${subheading.title}`}
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}