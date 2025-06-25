import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [initialBudget, setInitialBudget] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [deletedExpenses, setDeletedExpenses] = useState([]);
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ type: '', budget: '', spent: '' });
  const [todoForm, setTodoForm] = useState('');
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('expenses');
    const deleted = localStorage.getItem('deletedExpenses');
    const savedTodos = localStorage.getItem('todos');
    const savedBudget = localStorage.getItem('initialBudget');
    if (saved) setExpenses(JSON.parse(saved));
    if (deleted) setDeletedExpenses(JSON.parse(deleted));
    if (savedTodos) setTodos(JSON.parse(savedTodos));
    if (savedBudget) setInitialBudget(parseFloat(savedBudget));

    const interval = setInterval(cleanupDeleted, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('deletedExpenses', JSON.stringify(deletedExpenses));
  }, [deletedExpenses]);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('initialBudget', initialBudget.toString());
  }, [initialBudget]);

  const cleanupDeleted = () => {
    const now = Date.now();
    setDeletedExpenses(prev => prev.filter(item => now - item.deletedAt < 7 * 24 * 60 * 60 * 1000));
  };

  const createSuccessEffect = () => {
    const colors = ['#667eea', '#764ba2', '#56ab2f'];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = '50%';
        particle.style.animation = 'explode 1s ease-out forwards';
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
      }, i * 50);
    }
  };

  const handleDragStart = (e, expense) => {
    setDraggedItem(expense);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.6';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetExpense) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== targetExpense.id) {
      const draggedIndex = expenses.findIndex(exp => exp.id === draggedItem.id);
      const targetIndex = expenses.findIndex(exp => exp.id === targetExpense.id);

      const newExpenses = [...expenses];
      [newExpenses[draggedIndex], newExpenses[targetIndex]] = [newExpenses[targetIndex], newExpenses[draggedIndex]];
      setExpenses(newExpenses);
      createSuccessEffect();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const budget = parseFloat(form.budget);
    const spent = parseFloat(form.spent);

    if (!form.type || !budget || spent < 0) return;

    const expense = {
      id: editId || Date.now(),
      type: form.type,
      budget,
      spent: spent || 0,
      percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0
    };

    if (editId) {
      setExpenses(prev => prev.map(exp => exp.id === editId ? expense : exp));
      setEditId(null);
    } else {
      setExpenses(prev => [...prev, expense]);
      createSuccessEffect();
    }

    setForm({ type: '', budget: '', spent: '' });
  };

  const handleEdit = (expense) => {
    setForm({ type: expense.type, budget: expense.budget, spent: expense.spent });
    setEditId(expense.id);
  };

  const handleDelete = (id) => {
    const expense = expenses.find(exp => exp.id === id);
    setDeletedExpenses(prev => [...prev, { ...expense, deletedAt: Date.now() }]);
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const handleRestore = (id) => {
    const deleted = deletedExpenses.find(exp => exp.id === id);
    const { deletedAt, ...expense } = deleted;
    setExpenses(prev => [...prev, expense]);
    setDeletedExpenses(prev => prev.filter(exp => exp.id !== id));
    createSuccessEffect();
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!todoForm.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: todoForm, completed: false }]);
    setTodoForm('');
    createSuccessEffect();
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.spent, 0);
  const remaining = initialBudget - totalSpent;
  const budgetUsed = initialBudget > 0 ? Math.round((totalSpent / initialBudget) * 100) : 0;

  const chartData = expenses.map(exp => ({
    name: exp.type,
    budget: exp.budget,
    spent: exp.spent,
    percentage: exp.percentage
  }));

  const expenseTypes = expenses.reduce((acc, exp) => {
    acc[exp.type] = (acc[exp.type] || 0) + exp.spent;
    return acc;
  }, {});

  const pieData = Object.entries(expenseTypes).map(([type, amount]) => ({
    type,
    amount,
    percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
  }));

  return (
    <div className="app">
      <style jsx>{`
        @keyframes explode {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(0); opacity: 0; }
        }
      `}</style>

      <header className="header">
        <h1>💰 Expense Tracker</h1>
        <div className="budget-setup">
          <label>Budget:</label>
          <input
            type="number"
            value={initialBudget}
            onChange={(e) => setInitialBudget(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            placeholder="Set your total budget"
          />
        </div>
      </header>

      <div className="summary-grid">
        <div className="summary-card primary">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Budget</h3>
            <p className="amount">₹{initialBudget.toFixed(2)}</p>
          </div>
        </div>
        <div className="summary-card success">
          <div className="summary-icon">💸</div>
          <div className="summary-content">
            <h3>Total Spent</h3>
            <p className="amount">₹{totalSpent.toFixed(2)}</p>
            <div className="progress-mini">
              <div className="progress-fill" style={{ width: `${Math.min(budgetUsed, 100)}%` }}></div>
            </div>
          </div>
        </div>
        <div className={`summary-card ${remaining >= 0 ? 'info' : 'danger'}`}>
          <div className="summary-icon">{remaining >= 0 ? '✅' : '⚠️'}</div>
          <div className="summary-content">
            <h3>Remaining</h3>
            <p className="amount">₹{remaining.toFixed(2)}</p>
            <small>{budgetUsed}% used</small>
          </div>
        </div>
        <div className="summary-card warning">
          <div className="summary-icon">📋</div>
          <div className="summary-content">
            <h3>Categories</h3>
            <p className="amount">{expenses.length}</p>
            <small>{todos.filter(t => !t.completed).length} todos left</small>
          </div>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="visualization-section">
          <h2>📊 Analytics Dashboard</h2>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Budget Utilization</h3>
              <div className="donut-chart">
                <svg viewBox="0 0 200 200" className="donut-svg">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#f0f0f0" strokeWidth="20"/>
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="80" 
                    fill="none" 
                    stroke="url(#gradient1)" 
                    strokeWidth="20"
                    strokeDasharray={`${budgetUsed * 5.03} 502.4`}
                    strokeDashoffset="125.6"
                    transform="rotate(-90 100 100)"
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <text x="100" y="95" textAnchor="middle" className="chart-percentage">{budgetUsed}%</text>
                  <text x="100" y="115" textAnchor="middle" className="chart-label">Used</text>
                </svg>
              </div>
            </div>

            <div className="chart-card">
              <h3>Category Performance</h3>
              <div className="bar-chart">
                {chartData.map((item, index) => (
                  <div key={index} className="bar-item">
                    <div className="bar-label">{item.name}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${Math.min(item.percentage, 100)}%`,
                          background: item.percentage > 100 
                            ? 'linear-gradient(90deg, #e74c3c, #f1948a)' 
                            : 'linear-gradient(90deg, #667eea, #764ba2)'
                        }}
                      ></div>
                      <span className="bar-percentage">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>Expense Distribution</h3>
              <div className="pie-chart">
                <svg viewBox="0 0 200 200" className="pie-svg">
                  {pieData.map((item, index) => {
                    const colors = ['#667eea', '#764ba2', '#56ab2f', '#a8e6cf', '#ff6b6b', '#4ecdc4'];
                    const angle = (item.percentage / 100) * 360;
                    const startAngle = pieData.slice(0, index).reduce((sum, d) => sum + (d.percentage / 100) * 360, 0);

                    return (
                      <g key={index}>
                        <path
                          d={`M 100 100 L ${100 + 70 * Math.cos((startAngle - 90) * Math.PI / 180)} ${100 + 70 * Math.sin((startAngle - 90) * Math.PI / 180)} A 70 70 0 ${angle > 180 ? 1 : 0} 1 ${100 + 70 * Math.cos((startAngle + angle - 90) * Math.PI / 180)} ${100 + 70 * Math.sin((startAngle + angle - 90) * Math.PI / 180)} Z`}
                          fill={colors[index % colors.length]}
                          className="pie-slice"
                        />
                      </g>
                    );
                  })}
                </svg>
                <div className="pie-legend">
                  {pieData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: ['#667eea', '#764ba2', '#56ab2f', '#a8e6cf', '#ff6b6b', '#4ecdc4'][index % 6] }}></div>
                      <span>{item.type}: {item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="tabs">
        <button 
          className={activeTab === 'expenses' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('expenses')}
        >
          💳 Expenses
        </button>
        <button 
          className={activeTab === 'todos' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('todos')}
        >
          📝 Todo List
        </button>
      </nav>

      {activeTab === 'expenses' && (
        <div className="tab-content">
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="💼 Expense Type (e.g., Venue, Catering)"
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="💰 Budget Amount (₹)"
                value={form.budget}
                onChange={(e) => setForm(prev => ({ ...prev, budget: e.target.value }))}
                required
                min="0"
                step="0.01"
              />
              <input
                type="number"
                placeholder="💸 Spent Amount (₹)"
                value={form.spent}
                onChange={(e) => setForm(prev => ({ ...prev, spent: e.target.value }))}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editId ? '✏️ Update' : '➕ Add'} Expense
              </button>
              {editId && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => { setEditId(null); setForm({ type: '', budget: '', spent: '' }); }}
                >
                  ❌ Cancel
                </button>
              )}
            </div>
          </form>

          <div className="expenses-grid">
            {expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💳</div>
                <h3>No expenses yet</h3>
                <p>Add your first expense to get started!</p>
              </div>
            ) : (
              expenses.map(expense => (
                <div 
                  key={expense.id} 
                  className="expense-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, expense)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, expense)}
                >
                  <div className="expense-header">
                    <h3>{expense.type}</h3>
                    <div className="expense-actions">
                      <button onClick={() => handleEdit(expense)} className="btn-edit">✏️</button>
                      <button onClick={() => handleDelete(expense.id)} className="btn-delete">🗑️</button>
                    </div>
                  </div>
                  <div className="expense-details">
                    <div className="detail-row">
                      <span>Budget:</span>
                      <span className="amount">₹{expense.budget.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Spent:</span>
                      <span className="amount spent">₹{expense.spent.toFixed(2)}</span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className={`progress ${expense.percentage > 100 ? 'over-budget' : ''}`}
                          style={{ width: `${Math.min(expense.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="percentage">{expense.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'todos' && (
        <div className="tab-content">
          <form onSubmit={addTodo} className="todo-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="📝 Add a task (e.g., Book photographer, Send invitations)"
                value={todoForm}
                onChange={(e) => setTodoForm(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">➕ Add Task</button>
            </div>
          </form>

          <div className="todos-list">
            {todos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No tasks yet</h3>
                <p>Add planning tasks to stay organized!</p>
              </div>
            ) : (
              todos.map(todo => (
                <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  <div className="todo-content">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                    />
                    <span className="todo-text">{todo.text}</span>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="btn-delete">🗑️</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {deletedExpenses.length > 0 && (
        <div className="deleted-expenses">
          <h2>🗑️ Recently Deleted (7 days)</h2>
          {deletedExpenses.map(expense => (
            <div key={expense.id} className="expense-item deleted">
              <div className="expense-info">
                <h3>{expense.type}</h3>
                <p>Budget: ₹{expense.budget.toFixed(2)} | Spent: ₹{expense.spent.toFixed(2)}</p>
              </div>
              <button onClick={() => handleRestore(expense.id)} className="btn-restore">↩️ Restore</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;