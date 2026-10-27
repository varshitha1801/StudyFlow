// Function to safely get tasks from localStorage
function getTasks() {
    const tasksJSON = localStorage.getItem('studyTasks');
    return tasksJSON ? JSON.parse(tasksJSON) : [];
}

// Function to save tasks to localStorage
function saveTasks(tasks) {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
}

// Function to render the task list
function renderTasks() {
    const taskList = document.getElementById('task-list');
    const taskCountSpan = document.getElementById('task-count');
    taskList.innerHTML = '';
    
    let tasks = getTasks();
    const today = new Date().toISOString().split('T')[0];
    
    // Get filter values if they exist
    const searchInput = document.getElementById('search-input');
    const priorityFilter = document.getElementById('filter-priority');
    const statusFilter = document.getElementById('filter-status');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const priorityValue = priorityFilter ? priorityFilter.value : 'all';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    
    // Filter tasks based on search and filters
    let filteredTasks = tasks.filter(task => {
        // 1. Search filter
        const matchesSearch = !searchTerm || 
            task.subject.toLowerCase().includes(searchTerm) || 
            task.topic.toLowerCase().includes(searchTerm);
        
        // 2. Priority filter
        const matchesPriority = priorityValue === 'all' || task.priority === priorityValue;
        
        // 3. Status filter
        const isOverdue = !task.completed && task.date < today;
        const isToday = task.date === today && !task.completed;
        
        let matchesStatus = true;
        
        if (statusValue === 'completed') {
            matchesStatus = task.completed;
        } else if (statusValue === 'pending') {
            matchesStatus = !task.completed;
        } else if (statusValue === 'overdue') {
            matchesStatus = isOverdue;
        } else if (statusValue === 'today') {
            matchesStatus = isToday;
        } else if (statusValue === 'upcoming') {
            matchesStatus = task.date > today && !task.completed;
        }
        // 'all' status means matchesStatus remains true
        
        return matchesSearch && matchesPriority && matchesStatus;
    });
    
    // Sort tasks: Priority first (High > Medium > Low), then by Date
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    filteredTasks.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.date) - new Date(b.date);
    });
    
    // Display message if no tasks
    if (filteredTasks.length === 0) {
        const message = searchTerm || priorityValue !== 'all' || statusValue !== 'all' 
            ? 'No tasks match your filters. Try changing them.' 
            : 'No tasks yet. Add your first study task!';
        
        taskList.innerHTML = `
            <div class="no-tasks-message">
                <img src="images/study2.png" alt="No tasks" width="100" style="opacity: 0.5; margin-bottom: 15px;">
                <p style="font-size: 1.1rem; color: #6c757d;">${message}</p>
                ${tasks.length === 0 ? '<p class="sub-message">Click "Add Task" above to get started!</p>' : ''}
            </div>
        `;
        taskCountSpan.textContent = '0';
        return;
    }
    
    // Display filtered tasks
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `card task-item priority-${task.priority} ${task.completed ? 'task-completed' : ''}`;
        taskItem.dataset.id = task.id;
        taskItem.dataset.priority = task.priority;

        // Check task status
        const isOverdue = !task.completed && task.date < today;
        const isToday = task.date === today && !task.completed;
        const isUpcoming = task.date > today && !task.completed;
        
        // Add status classes
        if (isOverdue) {
            taskItem.classList.add('task-overdue');
        } else if (isToday) {
            taskItem.classList.add('task-today');
        } else if (isUpcoming) {
            taskItem.classList.add('task-upcoming');
        }

        // Format date nicely
        const date = new Date(task.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });

        // Create task HTML
        taskItem.innerHTML = `
            <div class="task-content">
                <div class="task-header">
                    <h4>${task.subject}</h4>
                    <div class="task-status">
                        ${isToday ? '<span class="today-badge">TODAY</span>' : ''}
                        ${isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
                        ${isUpcoming ? '<span class="upcoming-badge">UPCOMING</span>' : ''}
                        <span class="priority-tag priority-${task.priority}">${task.priority}</span>
                    </div>
                </div>
                <p class="topic">${task.topic}</p>
                <div class="task-info">
                    <span class="date-info">
                         ${formattedDate} 
                    </span>
                    <span class="duration-info"> ${task.duration} minutes</span>
                    ${task.completed ? 
                        `<span class="completed-badge">✓ Completed on ${task.completionDate}</span>` : 
                        ''
                    }
                </div>
            </div>
            <div class="task-actions">
                ${!task.completed ? `
                <button class="complete-btn" data-id="${task.id}" title="Mark Complete">
                    <i class="fas fa-check"></i> Mark Done
                </button>` : ''}
                <button class="edit-btn" data-id="${task.id}" title="Edit Task">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" data-id="${task.id}" title="Delete Task">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
        
        taskList.appendChild(taskItem);
    });

    // Update task count
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    taskCountSpan.textContent = `${filteredTasks.length} of ${totalTasks}`;
    taskCountSpan.title = `${completedTasks} completed, ${totalTasks - completedTasks} pending`;
}
// Enhanced notification function for planner
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.planner-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `planner-notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
// Function to handle adding or editing a task
function handleFormSubmit(event) {
    event.preventDefault();

    const subject = document.getElementById('subject').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const date = document.getElementById('date').value;
    const duration = parseInt(document.getElementById('duration').value);
    const priority = document.getElementById('priority').value;
    const formBtn = document.getElementById('add-task-btn');

    // Basic validation
    if (!subject || !topic || !date || isNaN(duration) || duration <= 0) {
        showNotification('Please fill in all fields correctly.', 'error');
        return;
    }

    // DATE VALIDATION - CANNOT SELECT PAST DATES
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        showNotification('Please select today or a future date.', 'error');
        document.getElementById('date').focus();
        return;
    }

    // Duration validation - reasonable study sessions
    if (duration < 5) {
        showNotification('Study duration should be at least 5 minutes.', 'error');
        document.getElementById('duration').focus();
        return;
    }
    
    if (duration > 360) { // 6 hours max
        showNotification('Study duration should not exceed 6 hours (360 minutes).', 'error');
        document.getElementById('duration').focus();
        return;
    }

    // Subject validation - prevent duplicates for same date
    let tasks = getTasks();
    const editingId = formBtn.dataset.editingId;
    
    // Check for duplicate subject on same date (when adding new task)
    if (!editingId) {
        const hasDuplicate = tasks.some(task => 
            task.subject.toLowerCase() === subject.toLowerCase() && 
            task.date === date && 
            !task.completed
        );
        
        if (hasDuplicate) {
            showNotification(`You already have a task for "${subject}" on ${date}. Consider editing the existing task.`, 'warning');
            return;
        }
    }

    if (editingId) {
        // Edit existing task
        const taskIndex = tasks.findIndex(t => t.id === editingId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                subject,
                topic,
                date,
                duration,
                priority
            };
            
            // Reset form button and state
            formBtn.textContent = 'Add Task';
            delete formBtn.dataset.editingId;
            formBtn.classList.remove('editing');
            showNotification('Task updated successfully!', 'success');
        }
    } else {
        // Add new task
        const newTask = {
            id: 'task-' + Date.now(),
            subject,
            topic,
            date,
            duration,
            priority,
            completed: false,
            completionDate: null,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        showNotification('Task added successfully!', 'success');
    }

    saveTasks(tasks);
    document.getElementById('task-form').reset();
    
    // Reset date to today
    document.getElementById('date').value = today;
    
    renderTasks();
}
// Function to set the form for editing
function editTask(id) {
    const tasks = getTasks();
    const taskToEdit = tasks.find(t => t.id === id);

    if (taskToEdit) {
        document.getElementById('subject').value = taskToEdit.subject;
        document.getElementById('topic').value = taskToEdit.topic;
        document.getElementById('date').value = taskToEdit.date;
        document.getElementById('duration').value = taskToEdit.duration;
        document.getElementById('priority').value = taskToEdit.priority;

        // Change button text and store ID for saving
        const formBtn = document.getElementById('add-task-btn');
        formBtn.textContent = 'Save Changes';
        formBtn.dataset.editingId = id;
        formBtn.classList.add('editing');

        // Scroll to form
        document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to delete a task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this study task?')) {
        let tasks = getTasks();
        tasks = tasks.filter(task => task.id !== id);
        saveTasks(tasks);
        renderTasks();
    }
}

// Event listener for task form submission
document.addEventListener('DOMContentLoaded', () => {
    // Set min date to today and default value
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today; // Set default to today
    
    // Set reasonable default for duration
    document.getElementById('duration').value = 30;
    
    // Event listeners
    document.getElementById('task-form').addEventListener('submit', handleFormSubmit);
    
    // Add input validation for duration
    document.getElementById('duration').addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value < 5) {
            this.setCustomValidity('Minimum 5 minutes');
        } else if (value > 360) {
            this.setCustomValidity('Maximum 360 minutes (6 hours)');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // Event delegation for task list
    document.getElementById('task-list').addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const taskId = target.dataset.id;
        
        if (target.classList.contains('delete-btn')) {
            deleteTask(taskId);
        } else if (target.classList.contains('edit-btn')) {
            editTask(taskId);
        } else if (target.classList.contains('complete-btn')) {
            markTaskComplete(taskId);
        }
    });
    
    // Add search/filter functionality if elements exist
    const searchInput = document.getElementById('search-input');
    const filterPriority = document.getElementById('filter-priority');
    const filterStatus = document.getElementById('filter-status');
    const clearFilters = document.getElementById('clear-filters');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderTasks);
    }
    if (filterPriority) {
        filterPriority.addEventListener('change', renderTasks);
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', renderTasks);
    }
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterPriority) filterPriority.value = 'all';
            if (filterStatus) filterStatus.value = 'all';
            renderTasks();
        });
    }
    
    renderTasks();
});
function markTaskComplete(id) {
    if (confirm('Mark this task as completed?')) {
        let tasks = getTasks();
        const taskIndex = tasks.findIndex(t => t.id === id);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = true;
            tasks[taskIndex].completionDate = new Date().toISOString().split('T')[0];
            saveTasks(tasks);
            
            renderTasks();
            showNotification('Task marked as completed!', 'success');
            
            // If on tracker page, refresh that too
            if (window.location.pathname.includes('tracker.html')) {
                window.location.reload();
            }
        }
    }
}