import { useState } from 'react';
import { useLocalStorage } from '../../core/useLocalStorage';
import { createId } from '../../core/idGenerator';
import TodoSidebar from '../../components/TodoSidebar';
import AddSubheadingModal from '../../components/AddSubheadingModal';
import TodoList from '../../components/TodoList';
import './Todo.css';

function useTodoState() {
  const [todosData, setTodosData] = useLocalStorage('todosData', {
    subheadings: [
      {
        id: 'inbox-default',
        title: 'Inbox',
        todos: [],
      },
    ],
  });

  const [selectedSubheadingID, setSelectedSubheadingID] = useState(() => {
    if (todosData.subheadings.length > 0) {
      return todosData.subheadings[0].id;
    }
    return null;
  });

  const addSubheading = (title) => {
    const newSubheading = {
      id: `subheading-${createId()}`,
      title,
      todos: [],
    };
    setTodosData((prev) => ({
      ...prev,
      subheadings: [...prev.subheadings, newSubheading],
    }));

    window.posthog?.capture("todo_subheading_added", {
      title,
      total_subheadings: todosData.subheadings.length + 1,
    });
    setSelectedSubheadingID(newSubheading.id);
    return newSubheading.id;
  };

  const deleteSubheading = (subheadingID) => {
    const subheading = todosData.subheadings.find((s) => s.id === subheadingID);
    const todoCount = subheading?.todos?.length ?? 0;

    setTodosData((prev) => ({
      ...prev,
      subheadings: prev.subheadings.filter((s) => s.id !== subheadingID),
    }));

    window.posthog?.capture("todo_subheading_deleted", {
      subheading_id: subheadingID,
      todos_in_subheading: todoCount,
      remaining_subheadings: todosData.subheadings.length - 1,
    });

    if (selectedSubheadingID === subheadingID && todosData.subheadings.length > 1) {
      const remainingSubheadings = todosData.subheadings.filter((s) => s.id !== subheadingID);
      setSelectedSubheadingID(remainingSubheadings[0].id);
    }
  };

  const addTodo = (subheadingID, title, dueDate = '') => {
    // Create once outside the updater to keep StrictMode re-runs idempotent.
    const newTodo = {
      id: `todo-${createId()}`,
      title,
      completed: false,
      dueDate,
    };

    setTodosData((prev) => ({
      ...prev,
      subheadings: prev.subheadings.map((s) =>
        s.id === subheadingID ? { ...s, todos: [...s.todos, newTodo] } : s
      ),
    }));

    window.posthog?.capture("todo_added", {
      subheading_id: subheadingID,
      has_due_date: !!dueDate,
    });

    return newTodo.id;
  };

  const updateTodo = (subheadingID, todoID, updates) => {
    setTodosData((prev) => ({
      ...prev,
      subheadings: prev.subheadings.map((s) =>
        s.id === subheadingID
          ? {
              ...s,
              todos: s.todos.map((t) =>
                t.id === todoID ? { ...t, ...updates } : t
              ),
            }
          : s
      ),
    }));
  };

  const deleteTodo = (subheadingID, todoID) => {
    setTodosData((prev) => ({
      ...prev,
      subheadings: prev.subheadings.map((s) =>
        s.id === subheadingID
          ? { ...s, todos: s.todos.filter((t) => t.id !== todoID) }
          : s
      ),
    }));
  };

  const toggleTodoCompletion = (subheadingID, todoID) => {
    // Capture current completion state before toggling.
    const currentTodo = todosData.subheadings
      .find((s) => s.id === subheadingID)
      ?.todos.find((t) => t.id === todoID);
    const wasCompleted = currentTodo?.completed ?? false;

    setTodosData((prev) => ({
      ...prev,
      subheadings: prev.subheadings.map((s) =>
        s.id === subheadingID
          ? {
              ...s,
              todos: s.todos.map((t) =>
                t.id === todoID ? { ...t, completed: !t.completed } : t
              ),
            }
          : s
      ),
    }));

    if (!wasCompleted) {
      window.posthog?.capture("todo_completed", {
        subheading_id: subheadingID,
        todo_id: todoID,
        had_due_date: !!currentTodo?.dueDate,
      });
    }
  };

  const getCurrentSubheading = () => {
    return todosData.subheadings.find((s) => s.id === selectedSubheadingID);
  };

  return {
    subheadings: todosData.subheadings,
    selectedSubheadingID,
    setSelectedSubheadingID,
    addSubheading,
    deleteSubheading,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoCompletion,
    getCurrentSubheading,
  };
}

export default function Todo() {
  const todoState = useTodoState();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="todo-container">
      <TodoSidebar
        subheadings={todoState.subheadings}
        selectedSubheadingID={todoState.selectedSubheadingID}
        onSelectSubheading={todoState.setSelectedSubheadingID}
        onAddSubheadingClick={() => setShowAddModal(true)}
        onDeleteSubheading={todoState.deleteSubheading}
      />

      <TodoList
        currentSubheading={todoState.getCurrentSubheading()}
        onAddTodo={todoState.addTodo}
        onUpdateTodo={todoState.updateTodo}
        onDeleteTodo={todoState.deleteTodo}
        onToggleTodoCompletion={todoState.toggleTodoCompletion}
      />

      {showAddModal && (
        <AddSubheadingModal
          onClose={() => setShowAddModal(false)}
          onConfirm={(title) => {
            todoState.addSubheading(title);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}