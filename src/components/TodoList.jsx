import { useState, useRef, useEffect } from "react";
import "./TodoList.css";

const CONFETTI_COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#06b6d4', '#ef4444', '#84cc16'];
const CONFETTI_DIRS = [
    { dx: '-44px', dy: '-38px' },
    { dx:  '44px', dy: '-38px' },
    { dx: '-54px', dy:   '0px' },
    { dx:  '54px', dy:   '0px' },
    { dx: '-38px', dy:  '38px' },
    { dx:  '38px', dy:  '38px' },
    { dx:   '0px', dy: '-54px' },
    { dx:   '0px', dy:  '48px' },
];

const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Done' },
    { value: 'dueToday', label: 'Due today' },
];

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
    const [confettiIds, setConfettiIds] = useState(() => new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState('all');
    const removalTimersRef = useRef(new Map());
    const addingTodoRef = useRef(false);
    const searchInputRef = useRef(null);

    const allTodos = currentSubheading?.todos || [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const todayStr = new Date().toISOString().slice(0, 10);

    const visibleTodos = allTodos.filter((todo) => {
        const matchesSearch = !normalizedQuery || todo.title.toLowerCase().includes(normalizedQuery);
        if (!matchesSearch) {
            return false;
        }

        if (filterMode === 'active') {
            return !todo.completed;
        }

        if (filterMode === 'completed') {
            return !!todo.completed;
        }

        if (filterMode === 'dueToday') {
            return !todo.completed && todo.dueDate === todayStr;
        }

        return true;
    });

    useEffect(() => {
        const handleSearchShortcut = (event) => {
            const hasCommandModifier = event.metaKey || event.ctrlKey;
            if (!hasCommandModifier || event.key.toLowerCase() !== 'f') {
                return;
            }

            event.preventDefault();
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        };

        window.addEventListener('keydown', handleSearchShortcut);
        return () => window.removeEventListener('keydown', handleSearchShortcut);
    }, []);

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
            // Play confetti immediately
            setConfettiIds((prev) => { const next = new Set(prev); next.add(todo.id); return next; });

            // After confetti finishes (650ms), start the height-collapse
            const confettiDone = setTimeout(() => {
                setConfettiIds((prev) => { const next = new Set(prev); next.delete(todo.id); return next; });
                setRemovingTodoIds((prev) => { const next = new Set(prev); next.add(todo.id); return next; });
            }, 650);
            removalTimersRef.current.set(todo.id + '-confetti', confettiDone);

            // Delete from state after confetti (650ms) + collapse transition (550ms)
            const timerId = setTimeout(() => {
                onDeleteTodo(currentSubheading.id, todo.id);
                removalTimersRef.current.delete(todo.id);
                removalTimersRef.current.delete(todo.id + '-confetti');
                setRemovingTodoIds((prev) => { const next = new Set(prev); next.delete(todo.id); return next; });
            }, 1200);

            removalTimersRef.current.set(todo.id, timerId);
        } else {
            const timerId = removalTimersRef.current.get(todo.id);
            if (timerId) {
                clearTimeout(timerId);
                removalTimersRef.current.delete(todo.id);
            }
            const confettiTimer = removalTimersRef.current.get(todo.id + '-confetti');
            if (confettiTimer) {
                clearTimeout(confettiTimer);
                removalTimersRef.current.delete(todo.id + '-confetti');
            }
            setConfettiIds((prev) => { const next = new Set(prev); next.delete(todo.id); return next; });
            setRemovingTodoIds((prev) => {
                const next = new Set(prev);
                next.delete(todo.id);
                return next;
            });
        }
    };

    const handleAdd = () => {
        if (!title.trim() || addingTodoRef.current) {
            return;
        }
        addingTodoRef.current = true;
        onAddTodo(currentSubheading.id, title.trim(), dueDate.trim());
        setTitle('');
        setDueDate('');
        // Use longer timeout to prevent any rapid re-submissions
        setTimeout(() => {
            addingTodoRef.current = false;
        }, 300);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        handleAdd();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            handleAdd();
        }
    };

    // Cleanup: Clear all pending timers on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            removalTimersRef.current.forEach((timerId) => clearTimeout(timerId));
            removalTimersRef.current.clear();
        };
    }, []);

    return (
        <div className="todo-list">
            <div className="todo-list-header">
                <h2>{currentSubheading.title}</h2>
                <span className="todo-count-badge">{visibleTodos.length}/{allTodos.length}</span>
            </div>

            <div className="todo-search-row">
                <input
                    ref={searchInputRef}
                    type="search"
                    className="todo-search-input"
                    placeholder="Search todos..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                />
                <div className="todo-filter-pills" role="tablist" aria-label="Todo filters">
                    {FILTER_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`todo-filter-pill ${filterMode === option.value ? 'is-active' : ''}`}
                            onClick={() => setFilterMode(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <form className="todo-inputs" onSubmit={handleSubmit}>
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
                <button type="button" className="todo-add-btn" onClick={handleAdd} disabled={!title.trim()}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            </form>

            {visibleTodos.length === 0 ? (
                <div className="todo-list-empty">
                    {allTodos.length === 0 ? 'No todos yet.' : 'No todos match this search/filter.'}
                </div>
            ) : (
                <div className="todo-items">
                    {visibleTodos.map((todo) => (
                        <div 
                            key={todo.id} 
                            className={`todo-item ${todo.completed ? 'done' : ''} ${
                                removingTodoIds.has(todo.id) ? 'removing' : ''
                            }`}
                        >
                            {confettiIds.has(todo.id) && (
                                <div className="confetti-burst" aria-hidden="true">
                                    {CONFETTI_DIRS.map((dir, i) => (
                                        <span
                                            key={i}
                                            className="confetti-dot"
                                            style={{
                                                '--dx': dir.dx,
                                                '--dy': dir.dy,
                                                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                                                animationDelay: `${i * 25}ms`,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
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
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}