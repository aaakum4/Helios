import { useState, useRef } from "react";
import "./TodoList.css";

export default function TodoList({
    currentSubheading,
    onAddTodo,
    onUpdateTodo,
    onDeleteTodo,
    onToggleTodoCompletion,
}) {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [removingTodoIds, setRemovingTodoIds] = useState(() => new Set());
    const removalTimersRef = useRef(new Map());

    if (!currentSubheading) {
        return (
            <div className="todo-list">
                <div className="todo-list-empty">Select a subheading to view todos.</div>
            </div>
        );
    }

    const handleToggle = (todo) => {
        const isCompleting = !todo.completed;

        onToggleTodoCompletion(currentSubheading.id, todo.id);

        if (isCompleting) {
            setRemovingTodoIds((prev) => {
                const next = new Set(prev);
                next.add(todo.id);
                return next;
            });

            const timerId = setTimeout(() => {
                onDeleteTodo(currentSubheading.id, todo.id);
                removalTimersRef.current.delete(todo.id);
                setRemovingTodoIds((prev) => {
                    const next = new Set(prev);
                    next.delete(todo.id);
                    return next;
                });
            }, 1500);

            removalTimersRef.current.set(todo.id, timerId);
        } else {
            const timerId = removalTimersRef.current.get(todo.id);
            if (timerId) {
                clearTimeout(timerId);
                removalTimersRef.current.delete(todo.id);
            }
            setRemovingTodoIds((prev) => {
                const next = new Set(prev);
                next.delete(todo.id);
                return next;
            });
        }
    };

    const handleAdd = () => {
        if (!title.trim()) {
            return;
        }
        onAddTodo(currentSubheading.id, title.trim(), dueDate.trim());
        setTitle('');
        setDueDate('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <div className="todo-list">
            <div className="todo-list-header">
                <h2>{currentSubheading.title}</h2>
                <span className="todo-count-badge">{currentSubheading.todos.length}</span>
            </div>

            <div className="todo-inputs">
                <input
                    type="text"
                    className="todo-input"
                    placeholder="Add a todo..."
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <input
                    type="date"
                    className="todo-date-input"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                />
                <button className="todo-add-btn" onClick={handleAdd} disabled={!title.trim()}>
                    Add
                </button>
            </div>

            {currentSubheading.todos.length === 0 ? (
                <div className="todo-list-empty">No todos yet.</div>
            ) : (
                <div className="todo-items">
                    {currentSubheading.todos.map((todo) => (
                        <div 
                            key={todo.id} 
                            className={`todo-item ${todo.completed ? 'done' : ''} ${
                                removingTodoIds.has(todo.id) ? 'removing' : ''
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggle(todo)}
                            />
                            <input
                                type="text"
                                className="todo-title-input"
                                value={todo.title}
                                onChange={(event) =>
                                    onUpdateTodo(currentSubheading.id, todo.id, { title: event.target.value })
                                }
                            />
                            <input
                                type="date"
                                className="todo-date-input"
                                value={todo.dueDate || ''}
                                onChange={(event) =>
                                    onUpdateTodo(currentSubheading.id, todo.id, { dueDate: event.target.value })
                                }
                            />
                            <button
                                className="todo-delete-btn"
                                onClick={() => onDeleteTodo(currentSubheading.id, todo.id)}
                                aria-label={`Delete ${todo.title}`}
                                title="Delete todo"
                            >
                                x
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}