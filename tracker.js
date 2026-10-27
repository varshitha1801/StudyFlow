// --- Quote Data ---
const motivationalQuotes = [
    "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
    "Strive for progress, not perfection.",
    "The mind is not a vessel to be filled, but a fire to be kindled. - Plutarch",
    "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
    "You don't have to be great to start, but you have to start to be great. - Zig Ziglar"
];

// Function to safely get tasks from localStorage
function getTasks() {
    const tasksJSON = localStorage.getItem('studyTasks');
    return tasksJSON ? JSON.parse(tasksJSON) : [];
}

// Function to save tasks to localStorage
function saveTasks(tasks) {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
}

// --- Progress & Stats Calculations ---

function calculateProgress() {
    const tasks = getTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;

    let totalDuration = 0; // Total planned duration in minutes
    let completedDuration = 0; // Duration of completed tasks

    tasks.forEach(task => {
        totalDuration += task.duration;
        if (task.completed) {
            completedDuration += task.duration;
        }
    });

    const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const totalStudyHours = (completedDuration / 60).toFixed(1);

    return {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        completionPercentage,
        totalStudyHours,
        completedTaskDates: tasks
            .filter(t => t.completed && t.completionDate)
            .map(t => new Date(t.completionDate).toISOString().split('T')[0])
    };
}

function calculateStudyStreak(completedDates) {
    if (completedDates.length === 0) return 0;

    // Get unique dates
    const uniqueDates = Array.from(new Set(completedDates)).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);
    let checkDateISO = checkDate.toISOString().split('T')[0];

    // Check if the current day has a completed task
    if (uniqueDates.includes(checkDateISO)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    } else {
        // If today is missed, check yesterday to maintain streak
        // The day must be yesterday if it's not today.
        // If the last study date was more than 1 day ago, the streak is 0.
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Now check backwards from yesterday
    for (let i = 0; i < uniqueDates.length; i++) {
        checkDateISO = checkDate.toISOString().split('T')[0];
        
        if (uniqueDates.includes(checkDateISO)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Streak broken
            break;
        }
    }
    
    return streak;
}


// --- DOM Rendering Functions ---

function renderProgressTracker() {
    const { totalTasks, completedTasks, pendingTasks, completionPercentage, totalStudyHours, completedTaskDates } = calculateProgress();

    // 1. Overall Progress
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const completedCount = document.getElementById('completed-count');
    const pendingCount = document.getElementById('pending-count');

    progressBar.style.width = `${completionPercentage}%`;
    progressBar.textContent = completionPercentage > 10 ? `${completionPercentage}%` : '';
    progressPercent.textContent = `${completionPercentage}%`;
    completedCount.textContent = completedTasks;
    pendingCount.textContent = pendingTasks;

    // 2. Statistics
    const totalHoursElement = document.getElementById('total-hours');
    totalHoursElement.textContent = `${totalStudyHours} hours`;

    // 3. Study Streak
    const streak = calculateStudyStreak(completedTaskDates);
    document.getElementById('study-streak').textContent = `${streak} days`;
    renderStreakVisualization(completedTaskDates);


    // 4. Motivation
    const quoteElement = document.getElementById('quote-text');
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    quoteElement.textContent = `"${motivationalQuotes[randomIndex]}"`;
}

function renderStreakVisualization(completedDates) {
    const streakGrid = document.getElementById('streak-grid');
    streakGrid.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIndex = today.getDay(); // 0=Sun

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    days.forEach((dayName, index) => {
        const dayElement = document.createElement('div');
        dayElement.className = 'streak-day';
        dayElement.textContent = dayName;

        if (index <= todayIndex) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - (todayIndex - index));
            const iso = checkDate.toISOString().split('T')[0];

            if (completedDates.includes(iso)) {
                dayElement.classList.add('completed');
            } else {
                dayElement.classList.add('missed');
            }
        }

        streakGrid.appendChild(dayElement);
    });
}

// --- Task Completion Logic (for the tracker page, though usually done on planner) ---

// This feature is better handled on the planner page, but since the prompt
// explicitly asks for a checkbox on the progress tracker page, we'll
// implement a simple listing here for checking off.

function renderTrackableTasks() {
    // Create or find the trackable tasks section
    let trackableSection = document.querySelector('.task-list-tracker');
    
    if (!trackableSection) {
        const newSection = document.createElement('section');
        newSection.className = 'card task-list-tracker';
        newSection.innerHTML = `
            <h3>Mark Tasks as Done</h3>
            <div class="task-filter-controls">
                <input type="text" id="tracker-search" placeholder="Search tasks..." class="tracker-search">
                <select id="tracker-priority-filter" class="tracker-filter">
                    <option value="all">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            <div id="trackable-tasks-list" class="task-list-tracker-container"></div>
        `;
        document.querySelector('.tracker-container').appendChild(newSection);
    }
    
    const taskList = document.getElementById('trackable-tasks-list');
    taskList.innerHTML = '';
    
    let tasks = getTasks();
    
    // Sort by due date (closest first)
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get filter values
    const searchTerm = document.getElementById('tracker-search')?.value.toLowerCase() || '';
    const priorityFilter = document.getElementById('tracker-priority-filter')?.value || 'all';
    
    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = !searchTerm || 
            task.subject.toLowerCase().includes(searchTerm) || 
            task.topic.toLowerCase().includes(searchTerm);
        
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        
        return matchesSearch && matchesPriority;
    });
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p class="no-tasks">No tasks found. Add some tasks in the Planner!</p>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item-tracker priority-${task.priority} ${task.completed ? 'task-completed' : ''}`;
        
        const date = new Date(task.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Check if overdue
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = !task.completed && task.date < today;
        
        taskElement.innerHTML = `
            <div class="tracker-task-checkbox">
                <input type="checkbox" id="tracker-task-${task.id}" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <label for="tracker-task-${task.id}" class="checkbox-label"></label>
            </div>
            <div class="tracker-task-content">
                <div class="tracker-task-header">
                    <h4>${task.subject}</h4>
                    <span class="tracker-priority-tag priority-${task.priority}">${task.priority}</span>
                    ${isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
                </div>
                <p class="tracker-topic">${task.topic}</p>
                <div class="tracker-task-info">
                    <span class="date-info"> Due: ${formattedDate}</span>
                    <span class="duration-info"> ${task.duration} mins</span>
                    ${task.completed ? '<span class="completed-date">✓ Completed on ' + task.completionDate + '</span>' : ''}
                </div>
            </div>
        `;
        taskList.appendChild(taskElement);
    });
    
    // Add event listeners for filters
    const searchInput = document.getElementById('tracker-search');
    const prioritySelect = document.getElementById('tracker-priority-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderTrackableTasks);
    }
    if (prioritySelect) {
        prioritySelect.addEventListener('change', renderTrackableTasks);
    }
}
// Add this notification function
function showNotification(message) {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
function toggleTaskCompletion(id, isCompleted) {
    let tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex !== -1) {
        // Update the task
        tasks[taskIndex].completed = isCompleted;
        tasks[taskIndex].completionDate = isCompleted ? new Date().toISOString().split('T')[0] : null;
        
        // Save to localStorage
        saveTasks(tasks);
        
        // Re-render everything
        renderTrackableTasks();
        renderProgressTracker();
        
        // Show notification
        showNotification(`Task marked as ${isCompleted ? 'completed' : 'pending'}!`);
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial rendering of all tracker components
    renderProgressTracker();
    
    // Render the task list for completion toggling
    renderTrackableTasks();

    // Event listener for completion checkboxes
    document.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox' && event.target.dataset.id) {
            toggleTaskCompletion(event.target.dataset.id, event.target.checked);
        }
    });
});