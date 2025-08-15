class TodoApp {
            constructor() {
                this.tasks = [];
                this.currentFilter = 'all';
                this.editingId = null;
                this.nextId = 1;
                this.deleteTaskId = null;
                
                this.init();
            }

            init() {
                this.loadFromStorage();
                this.bindEvents();
                this.render();
            }

            bindEvents() {
                // Add task
                document.getElementById('addTaskButton').onclick = () => this.addTask();
                document.getElementById('newTaskInput').onkeypress = (e) => {
                    if (e.key === 'Enter') this.addTask();
                };

                // Filter tabs
                document.querySelectorAll('.filter-tab').forEach(tab => {
                    tab.onclick = () => this.setFilter(tab.dataset.filter);
                });

                // Delete modal
                document.getElementById('confirmDelete').onclick = () => this.confirmDelete();
                document.getElementById('cancelDelete').onclick = () => this.cancelDelete();
                document.getElementById('deleteModal').onclick = (e) => {
                    if (e.target.id === 'deleteModal') this.cancelDelete();
                };
            }

            addTask() {
                const input = document.getElementById('newTaskInput');
                const dateInput = document.getElementById('taskDate');
                const timeInput = document.getElementById('taskTime');
                
                const text = input.value.trim();
                if (!text) {
                    alert('Please enter a task!');
                    input.focus();
                    return;
                }

                const task = {
                    id: this.nextId++,
                    text: text,
                    completed: false,
                    date: dateInput.value || null,
                    time: timeInput.value || null,
                    createdAt: Date.now()
                };

                this.tasks.unshift(task);
                
                // Clear inputs
                input.value = '';
                dateInput.value = '';
                timeInput.value = '';
                
                this.saveToStorage();
                this.render();
                input.focus();
            }

            deleteTask(id) {
                const task = this.tasks.find(t => t.id === id);
                if (!task) return;

                this.deleteTaskId = id;
                document.getElementById('deleteMessage').textContent = 
                    `Are you sure you want to delete "${task.text}"?`;
                document.getElementById('deleteModal').classList.add('show');
            }

            confirmDelete() {
                if (this.deleteTaskId) {
                    this.tasks = this.tasks.filter(t => t.id !== this.deleteTaskId);
                    this.saveToStorage();
                    this.render();
                }
                this.cancelDelete();
            }

            cancelDelete() {
                this.deleteTaskId = null;
                document.getElementById('deleteModal').classList.remove('show');
            }

            toggleComplete(id) {
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    this.saveToStorage();
                    this.render();
                }
            }

            startEdit(id) {
                this.editingId = id;
                this.render();
            }

            saveEdit(id) {
                const input = document.getElementById(`edit-${id}`);
                const newText = input.value.trim();
                
                if (!newText) {
                    alert('Task cannot be empty!');
                    input.focus();
                    return;
                }

                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.text = newText;
                    this.editingId = null;
                    this.saveToStorage();
                    this.render();
                }
            }

            cancelEdit() {
                this.editingId = null;
                this.render();
            }

            setFilter(filter) {
                this.currentFilter = filter;
                
                document.querySelectorAll('.filter-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.filter === filter);
                });
                
                this.render();
            }

            getFilteredTasks() {
                switch (this.currentFilter) {
                    case 'pending':
                        return this.tasks.filter(t => !t.completed);
                    case 'completed':
                        return this.tasks.filter(t => t.completed);
                    default:
                        return this.tasks;
                }
            }

            render() {
                this.renderTasks();
                this.renderStats();
            }

            renderTasks() {
                const container = document.getElementById('tasksContainer');
                const filteredTasks = this.getFilteredTasks();

                if (filteredTasks.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">📋</div>
                            <h3>No tasks yet</h3>
                            <p>Add your first task above to get started on your productivity journey!</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
                this.bindTaskEvents();
            }

            renderTask(task) {
                const isEditing = this.editingId === task.id;
                
                let metaInfo = '';
                if (task.date || task.time) {
                    const datePart = task.date ? `📅 ${this.formatDate(task.date)}` : '';
                    const timePart = task.time ? `🕒 ${this.formatTime(task.time)}` : '';
                    metaInfo = `
                        <div class="task-meta">
                            ${datePart ? `<span class="meta-badge">${datePart}</span>` : ''}
                            ${timePart ? `<span class="meta-badge">${timePart}</span>` : ''}
                        </div>
                    `;
                }

                if (isEditing) {
                    return `
                        <div class="task-card editing">
                            <div class="task-header">
                                <div class="task-content">
                                    <input type="text" id="edit-${task.id}" class="edit-input" value="${this.escapeHtml(task.text)}" maxlength="300">
                                    ${metaInfo}
                                </div>
                                <div class="task-actions">
                                    <button class="action-button save-btn" data-action="save" data-id="${task.id}">Save</button>
                                    <button class="action-button cancel-btn" data-action="cancel">Cancel</button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="task-card ${task.completed ? 'completed' : ''}">
                        <div class="task-header">
                            <div class="task-content">
                                <div class="task-text">${this.escapeHtml(task.text)}</div>
                                ${metaInfo}
                            </div>
                            <div class="task-actions">
                                <button class="action-button ${task.completed ? 'incomplete-btn' : 'complete-btn'}" data-action="toggle" data-id="${task.id}">
                                    ${task.completed ? '↩️ Undo' : '✅ Complete'}
                                </button>
                                <button class="action-button edit-btn" data-action="edit" data-id="${task.id}">✏️ Edit</button>
                                <button class="action-button delete-btn" data-action="delete" data-id="${task.id}">🗑️ Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            bindTaskEvents() {
                document.querySelectorAll('[data-action]').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const action = btn.dataset.action;
                        const id = parseInt(btn.dataset.id);

                        switch (action) {
                            case 'delete':
                                this.deleteTask(id);
                                break;
                            case 'toggle':
                                this.toggleComplete(id);
                                break;
                            case 'edit':
                                this.startEdit(id);
                                break;
                            case 'save':
                                this.saveEdit(id);
                                break;
                            case 'cancel':
                                this.cancelEdit();
                                break;
                        }
                    };
                });

                // Add enter key support for edit inputs
                document.querySelectorAll('[id^="edit-"]').forEach(input => {
                    input.onkeypress = (e) => {
                        if (e.key === 'Enter') {
                            const id = parseInt(input.id.replace('edit-', ''));
                            this.saveEdit(id);
                        } else if (e.key === 'Escape') {
                            this.cancelEdit();
                        }
                    };
                    input.focus();
                    input.select();
                });
            }

            renderStats() {
                const total = this.tasks.length;
                const completed = this.tasks.filter(t => t.completed).length;
                const pending = total - completed;

                document.getElementById('totalCount').textContent = total;
                document.getElementById('completedCount').textContent = completed;
                document.getElementById('pendingCount').textContent = pending;
            }

            saveToStorage() {
                try {
                    const data = {
                        tasks: this.tasks,
                        nextId: this.nextId
                    };
                    const storage = {};
                    storage['todoMasterData'] = JSON.stringify(data);
                } catch (error) {
                    console.error('Failed to save to storage:', error);
                }
            }

            loadFromStorage() {
                try {
                    // For this demo, we'll start with empty tasks
                    this.tasks = [];
                    this.nextId = 1;
                } catch (error) {
                    console.error('Failed to load from storage:', error);
                    this.tasks = [];
                    this.nextId = 1;
                }
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            formatDate(dateString) {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            formatTime(timeString) {
                const [hours, minutes] = timeString.split(':');
                const date = new Date();
                date.setHours(parseInt(hours), parseInt(minutes));
                return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
        }

        // Initialize the app when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new TodoApp();
        });