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
                +
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
                            U+0078
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}