import React, { use } from 'react';
import { useLocalStorage } from '../../core/useLocalStorage';
import TodoSidebar from './components/TodoSidebar';
import TodoList from './components/TodoList';
import AddSubheadingModal from '.components/AddSubheadingModal';
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

const [selectedSubheadingsID, setSelectedSubheadingsID] = useState(() => {
  if (todosData.subheadings.length > 0) {
    return todosData.subheadings[0].id;
  }
  return null;
});

const addSubheading = (title) => {
  const newSubheading = {
    id: `subheading-${Date.now()}`,
    title,
    todos: [],
  };
  setTodosData((prev) => ({
    ...prev,
    subheadings: [...prev.subheadings, newSubheading],
  }));
  
  setSelectedSubheadingsID(newSubheading.id);
  return newSubheading.id;
};

const deleteSubheading = (subheadingID) => {
  setTodosData((prev) => ({
    ...prev,
    subheadings: prev.subheadings.filter((s) => s.id !== subheadingID),
  }));

  if (selectedSubheadingsID == subheadingID && todosData.subheadings.length > 1) {
    const remainingSubheadings = todosData.subheadings.filter((s) => s.id !== subheadingID);
    setSelectedSubheadingsID(remainingSubheadings[0].id);
  }
};

const addTodo = (subheadingID, title, dueDate = '') => {
  const newTodo = {
    id: `todo-${Date.now()}`,
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

const toggleTodoCompletetion = (subheadingID, todoID) => {
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
};

const getCurrentSubheading = () => {
  return todosData.subheadings.find((s) => s.id === selectedSubheadingsID);
};

return {
  subheadings: todosData.subheadings,
  selectedSubheadingsID,
  setSelectedSubheadingsID,
  addSubheading,
  deleteSubheading,
  addTodo,
  updateTodo,
  deleteTodo,
  toggelTodoCompletion,
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
        selectedSubheadingsID={todoState.selectedSubheadingsID}
        onSelectSubheading={todoState.setSelectedSubheadingsID}
        onAddSubheading={() => setShowAddModal(true)}
        onDeleteSubheading={todoState.deleteSubheading}
      />

      <TodoList
        currentSubheading={todoState.getCurrentSubheading()}
        onAddTodo={todoState.addTodo}
        onUpdateTodo={todoState.updateTodo}
        onDeleteTodo={todoState.deleteTodo}
        onToggleTodoCompletion={todoState.toggleTodoCompletetion}
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