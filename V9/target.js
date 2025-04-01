// Store programs and tasks in localStorage
let programs = JSON.parse(localStorage.getItem('programs')) || [];
let currentProgramId = null;

// DOM Elements
const programSelectionView = document.getElementById('programSelection');
const programView = document.getElementById('programView');
const programList = document.getElementById('programList');
const programModal = document.getElementById('programModal');
const programForm = document.getElementById('programForm');
const addProgramBtn = document.getElementById('addProgramBtn');
const cancelProgramBtn = document.getElementById('cancelProgramBtn');
const currentProgramName = document.getElementById('currentProgramName');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

// Dropdown Menu Management
const dropdown = document.querySelector('.dropdown');
const dropdownMenu = document.querySelector('.dropdown-menu');
const backToProgramsBtn = document.getElementById('backToProgramsBtn');

// Show dropdown by default when page loads
dropdown.classList.add('active');

// Toggle dropdown on click
dropdown.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    dropdown.classList.toggle('active');
});

// Ensure dropdown stays visible after any view changes
function ensureDropdownVisible() {
    if (!dropdown.classList.contains('active')) {
        dropdown.classList.add('active');
    }
}

// Function to update dropdown menu visibility based on view
function updateDropdownMenuVisibility(isProgramList) {
    if (isProgramList) {
        // Hide all buttons except Create New Program
        addTaskBtn.style.display = 'none';
        addReportBtn.style.display = 'none';
        backToProgramsBtn.style.display = 'none';
        addProgramBtn.style.display = 'flex';
    } else {
        // Show all buttons except Create New Program
        addTaskBtn.style.display = 'flex';
        addReportBtn.style.display = 'flex';
        backToProgramsBtn.style.display = 'flex';
        addProgramBtn.style.display = 'none';
    }
}

// Add event listener for back button
backToProgramsBtn.addEventListener('click', () => {
    showProgramSelection();
});

// Add task info modal HTML to the page
const taskInfoModal = document.createElement('div');
taskInfoModal.className = 'modal';
taskInfoModal.id = 'taskInfoModal';
taskInfoModal.style.display = 'none'; // Hide modal by default
taskInfoModal.innerHTML = `
    <div class="modal-content">
        <h2>Task Information</h2>
        <div class="task-info-content">
            <div class="task-info-header">
                <div class="task-color-indicator"></div>
                <h3 class="task-name"></h3>
            </div>
            <div class="task-details"></div>
            <div class="task-dates">
                <div class="task-date">
                    <span class="date-label">Created:</span>
                    <span class="created-date"></span>
                </div>
                <div class="task-date">
                    <span class="date-label">Due:</span>
                    <span class="due-date"></span>
                </div>
                <div class="task-date">
                    <span class="date-label">Progress:</span>
                    <span class="task-progress"></span>
                </div>
            </div>
            <div class="task-comments">
                <div class="comments-header">
                    <h4>Comments</h4>
                    <button class="secondary-button" id="addCommentBtn">
                        <i class="fas fa-plus"></i> Add Comment
                    </button>
                </div>
                <div class="comments-list"></div>
                <div class="comment-form" style="display: none;">
                    <div class="form-group">
                        <label for="commentName">Name</label>
                        <input type="text" id="commentName" placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label for="commentText">Comment</label>
                        <textarea id="commentText" placeholder="Enter your comment"></textarea>
                    </div>
                    <div class="modal-buttons">
                        <button class="secondary-button" id="cancelCommentBtn">Cancel</button>
                        <button class="primary-button" id="saveCommentBtn">Save Comment</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="secondary-button" id="completeTaskBtn">
                <i class="fas fa-check-circle"></i> Complete Task
            </button>
            <button class="secondary-button" id="closeTaskInfoBtn">Close</button>
        </div>
    </div>
`;
document.body.appendChild(taskInfoModal);

// Add styles for task info modal
const style = document.createElement('style');
style.textContent = `
    .task-info-content {
        padding: 32px;
        overflow-y: auto;
        max-height: calc(500px - 120px);
        flex: 1;
        width: 100%;
        box-sizing: border-box;
    }
    .task-info-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        width: 100%;
    }
    .task-color-indicator {
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }
    .task-name {
        margin: 0;
        font-size: 20px;
        color: #333;
        font-weight: 600;
        line-height: 1.3;
    }
    .task-details {
        margin-bottom: 24px;
        color: #666;
        line-height: 1.6;
        font-size: 14px;
        width: 100%;
    }
    .task-dates {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 32px;
        width: 100%;
    }
    .task-date {
        display: flex;
        gap: 12px;
        width: 100%;
    }
    .date-label {
        font-weight: 500;
        color: #666;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Add event listener for closing task info modal
document.getElementById('closeTaskInfoBtn').addEventListener('click', () => {
    taskInfoModal.style.display = 'none';
});

// Add event listeners for comment functionality
const addCommentBtn = document.getElementById('addCommentBtn');
const cancelCommentBtn = document.getElementById('cancelCommentBtn');
const saveCommentBtn = document.getElementById('saveCommentBtn');
const commentForm = document.querySelector('.comment-form');
const commentsList = document.querySelector('.comments-list');

let currentTaskId = null;

addCommentBtn.addEventListener('click', () => {
    commentForm.style.display = 'block';
});

cancelCommentBtn.addEventListener('click', () => {
    commentForm.style.display = 'none';
    document.getElementById('commentName').value = '';
    document.getElementById('commentText').value = '';
});

saveCommentBtn.addEventListener('click', () => {
    const name = document.getElementById('commentName').value;
    const text = document.getElementById('commentText').value;
    
    if (!name || !text) return;
    
    const comment = {
        id: Date.now().toString(),
        name,
        text,
        date: new Date().toISOString()
    };
    
    // Add comment to task
    const program = programs.find(p => p.id === currentProgramId);
    if (!program) return;
    
    const task = program.tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    
    if (!task.comments) task.comments = [];
    task.comments.push(comment);
    
    // Save to localStorage
    localStorage.setItem('programs', JSON.stringify(programs));
    
    // Add comment to UI
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${name}</span>
            <span class="comment-date">${new Date(comment.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</span>
        </div>
        <div class="comment-text">${text}</div>
    `;
    
    commentsList.insertBefore(commentElement, commentsList.firstChild);
    
    // Reset form
    commentForm.style.display = 'none';
    document.getElementById('commentName').value = '';
    document.getElementById('commentText').value = '';
});

// Program Management
function showProgramSelection() {
    programSelectionView.style.display = 'block';
    programView.style.display = 'none';
    currentProgramId = null;
    renderProgramList();
    ensureDropdownVisible();
    updateDropdownMenuVisibility(true);
}

function showProgramView(programId) {
    programSelectionView.style.display = 'none';
    programView.style.display = 'block';
    currentProgramId = programId;
    const program = programs.find(p => p.id === programId);
    if (program) {
        currentProgramName.textContent = program.name;
        updateGanttChart();
        updateCompletedTasksList();
    }
    ensureDropdownVisible();
    updateDropdownMenuVisibility(false);
}

function renderProgramList() {
    programList.innerHTML = '';
    if (programs.length === 0) {
        programList.innerHTML = '<div class="empty-state">No programs yet. Click "New Program" to create one.</div>';
        return;
    }
    
    // Sort programs by completion status and most recent activity
    const sortedPrograms = [...programs].sort((a, b) => {
        // First sort by completion status
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        // Then sort by most recent activity
        const aLatest = getLatestActivity(a);
        const bLatest = getLatestActivity(b);
        return bLatest - aLatest;
    });
    
    sortedPrograms.forEach(program => {
        const programCard = document.createElement('div');
        programCard.className = 'program-card';
        if (program.completed) {
            programCard.classList.add('completed');
        }
        
        // Calculate statistics
        const totalReports = program.reports ? program.reports.length : 0;
        const today = new Date().toISOString().split('T')[0];
        const reportsToday = program.reports ? program.reports.filter(report => 
            report.createdAt.split('T')[0] === today
        ).length : 0;
        
        // Calculate average task completion
        const totalTasks = program.tasks.length;
        const averageCompletion = totalTasks > 0 
            ? Math.round(program.tasks.reduce((sum, task) => sum + (task.percentageComplete || 0), 0) / totalTasks)
            : 0;
        
        // Get latest activity
        const latestActivity = getLatestActivity(program);
        const activityDate = new Date(latestActivity);
        const activityText = formatActivityDate(activityDate);
        
        programCard.innerHTML = `
            <div class="program-header">
                <h4>${program.name}</h4>
                <div class="program-actions">
                    ${program.completed ? '<span class="complete-label">Complete</span>' : ''}
                    <span class="activity-date">Last active: ${activityText}</span>
                    <button class="program-settings-btn" title="Program Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
            <p class="program-description">${program.description || 'No description'}</p>
            <div class="program-stats">
                <div class="stats-row">
                    <div class="stat-item">
                        <i class="fas fa-tasks"></i>
                        <span>${totalTasks} tasks</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-chart-line"></i>
                        <span>${averageCompletion}% complete</span>
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-item">
                        <i class="fas fa-file-alt"></i>
                        <span>${totalReports} reports</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-calendar-day"></i>
                        <span>${reportsToday} today</span>
                    </div>
                </div>
            </div>
            <div class="program-settings-popup" style="display: none;">
                <button class="program-action-btn complete-program">
                    <i class="fas fa-check-circle"></i>
                    ${program.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                </button>
                <button class="program-action-btn delete-program">
                    <i class="fas fa-trash"></i>
                    Delete Program
                </button>
            </div>
        `;

        // Add click event for program card
        programCard.addEventListener('click', (e) => {
            if (!e.target.closest('.program-settings-btn') && !e.target.closest('.program-settings-popup')) {
                showProgramView(program.id);
            }
        });

        // Add click event for settings button
        const settingsBtn = programCard.querySelector('.program-settings-btn');
        const settingsPopup = programCard.querySelector('.program-settings-popup');
        
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const allPopups = document.querySelectorAll('.program-settings-popup');
            allPopups.forEach(p => {
                if (p !== settingsPopup) p.style.display = 'none';
            });
            settingsPopup.style.display = settingsPopup.style.display === 'none' ? 'block' : 'none';
        });

        // Add click event for complete button
        const completeBtn = programCard.querySelector('.complete-program');
        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            program.completed = !program.completed;
            if (program.completed) {
                program.completedAt = new Date().toISOString();
            } else {
                delete program.completedAt;
            }
            localStorage.setItem('programs', JSON.stringify(programs));
            settingsPopup.style.display = 'none';
            renderProgramList();
        });

        // Add click event for delete button
        const deleteBtn = programCard.querySelector('.delete-program');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
                const index = programs.findIndex(p => p.id === program.id);
                if (index !== -1) {
                    programs.splice(index, 1);
                    localStorage.setItem('programs', JSON.stringify(programs));
                    renderProgramList();
                }
            }
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!programCard.contains(e.target)) {
                settingsPopup.style.display = 'none';
            }
        });

        programList.appendChild(programCard);
    });
}

// Helper function to get latest activity timestamp
function getLatestActivity(program) {
    let latest = 0;
    
    // Check tasks
    program.tasks.forEach(task => {
        const taskDate = new Date(task.createdAt).getTime();
        latest = Math.max(latest, taskDate);
    });
    
    // Check reports
    if (program.reports) {
        program.reports.forEach(report => {
            const reportDate = new Date(report.createdAt).getTime();
            latest = Math.max(latest, reportDate);
        });
    }
    
    // If no activity found, use program creation date
    if (latest === 0 && program.createdAt) {
        latest = new Date(program.createdAt).getTime();
    }
    
    return latest;
}

// Helper function to format activity date
function formatActivityDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return 'Today';
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Program Modal Management
addProgramBtn.addEventListener('click', () => {
    programModal.style.display = 'flex';
});

cancelProgramBtn.addEventListener('click', () => {
    programModal.style.display = 'none';
    programForm.reset();
});

programForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const program = {
        id: Date.now(),
        name: document.getElementById('programName').value,
        description: document.getElementById('programDescription').value,
        tasks: [],
        createdAt: new Date().toISOString().split('T')[0]
    };

    programs.push(program);
    localStorage.setItem('programs', JSON.stringify(programs));
    
    programModal.style.display = 'none';
    programForm.reset();
    renderProgramList();
    ensureDropdownVisible();
});

// Task Modal Management
addTaskBtn.addEventListener('click', () => {
    taskModal.style.display = 'flex';
});

cancelTaskBtn.addEventListener('click', () => {
    taskModal.style.display = 'none';
    taskForm.reset();
    document.querySelector('.color-option').classList.add('selected');
    document.getElementById('selectedColor').value = '#FF6B6B';
});

// Color picker functionality
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        document.getElementById('selectedColor').value = option.dataset.color;
    });
});

// Set default selected color
document.querySelector('.color-option').classList.add('selected');

// Task form submission
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!currentProgramId) return;
    
    const task = {
        id: Date.now(),
        name: document.getElementById('taskName').value,
        details: document.getElementById('taskDetails').value,
        dueDate: document.getElementById('dueDate').value,
        color: document.getElementById('selectedColor').value,
        createdAt: new Date().toISOString().split('T')[0],
        percentageComplete: 0
    };

    const programIndex = programs.findIndex(p => p.id === currentProgramId);
    if (programIndex !== -1) {
        programs[programIndex].tasks.push(task);
        localStorage.setItem('programs', JSON.stringify(programs));
        
        // Clear form and close modal
        taskForm.reset();
        taskModal.style.display = 'none';
        document.querySelector('.color-option').classList.add('selected');
        document.getElementById('selectedColor').value = '#FF6B6B';
        
        // Update Gantt chart
        updateGanttChart();
        ensureDropdownVisible();
    }
});

// Report Management
const reportModal = document.getElementById('reportModal');
const reportForm = document.getElementById('reportForm');
const cancelReportBtn = document.getElementById('cancelReportBtn');
const photoUpload = document.getElementById('photoUpload');
const photoPreview = document.getElementById('photoPreview');
const addReportBtn = document.getElementById('addReportBtn');
let selectedPhotos = [];

// Show report modal
addReportBtn.addEventListener('click', () => {
    const taskSelect = document.getElementById('taskSelect');
    taskSelect.innerHTML = '<option value="">Choose a task...</option>';
    
    // Populate task select with current tasks
    const program = programs.find(p => p.id === currentProgramId);
    if (program && program.tasks) {
        program.tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            taskSelect.appendChild(option);
        });
    }
    
    reportModal.style.display = 'flex';
    selectedPhotos = [];
    photoPreview.innerHTML = '';
});

// Add event listener for task selection
document.getElementById('taskSelect').addEventListener('change', (e) => {
    const taskId = e.target.value;
    const program = programs.find(p => p.id === currentProgramId);
    if (!program || !taskId) return;
    
    const task = program.tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;
    
    // Create or update current progress display
    let progressDisplay = document.querySelector('.current-progress-display');
    if (!progressDisplay) {
        progressDisplay = document.createElement('div');
        progressDisplay.className = 'current-progress-display';
        document.getElementById('taskSelect').parentNode.insertBefore(progressDisplay, document.getElementById('taskSelect').nextSibling);
    }
    
    progressDisplay.innerHTML = `
        <div class="progress-label">Current Progress:</div>
        <div class="progress-value">${task.percentageComplete || 0}%</div>
    `;
});

// Handle photo upload
photoUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-preview-item';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-photo">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                photoItem.querySelector('.remove-photo').addEventListener('click', () => {
                    photoItem.remove();
                    selectedPhotos = selectedPhotos.filter(p => p !== file);
                });
                photoPreview.appendChild(photoItem);
                selectedPhotos.push(file);
            };
            reader.readAsDataURL(file);
        }
    });
});

// Handle report form submission
reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('reportTitle').value;
    const comment = document.getElementById('reportComment').value;
    const taskId = document.getElementById('taskSelect').value;
    const percentage = parseInt(document.getElementById('reportPercentage').value);
    
    if (!title || !comment || !taskId) return;
    
    const program = programs.find(p => p.id === currentProgramId);
    if (!program) return;
    
    const task = program.tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;
    
    // Update task percentage
    task.percentageComplete = percentage;
    
    // Create report object with checked status
    const report = {
        id: Date.now().toString(),
        title,
        comment,
        taskId: parseInt(taskId),
        createdAt: new Date().toISOString(),
        photos: [],
        percentageComplete: percentage,
        checked: false // Initialize checked status
    };
    
    // Handle photo uploads
    const photoPromises = selectedPhotos.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                report.photos.push(e.target.result);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    });
    
    // Wait for all photos to be processed
    Promise.all(photoPromises).then(() => {
        // Add report to program
        if (!program.reports) program.reports = [];
        program.reports.push(report);
        
        // Save to localStorage
        localStorage.setItem('programs', JSON.stringify(programs));
        
        // Update Gantt chart
        updateGanttChart();
        
        // Close modal and reset form
        reportModal.style.display = 'none';
        reportForm.reset();
        photoPreview.innerHTML = '';
        selectedPhotos = [];
        ensureDropdownVisible();
    });
});

// Cancel report creation
cancelReportBtn.addEventListener('click', () => {
    reportModal.style.display = 'none';
    reportForm.reset();
    photoPreview.innerHTML = '';
    selectedPhotos = [];
    // Remove current progress display if it exists
    const progressDisplay = document.querySelector('.current-progress-display');
    if (progressDisplay) {
        progressDisplay.remove();
    }
});

// Update Gantt chart
function updateGanttChart() {
    const ganttChart = document.getElementById('ganttChart');
    ganttChart.innerHTML = '';

    if (!currentProgramId) return;

    const program = programs.find(p => p.id === currentProgramId);
    if (!program || !program.tasks.length) {
        // Show empty state
        ganttChart.innerHTML = '<div class="empty-state">No tasks yet. Click the + button to add a task.</div>';
        return;
    }

    // Create or update task labels container
    let taskLabelsContainer = document.querySelector('.task-labels-container');
    if (!taskLabelsContainer) {
        taskLabelsContainer = document.createElement('div');
        taskLabelsContainer.className = 'task-labels-container';
        document.body.appendChild(taskLabelsContainer);
    }
    taskLabelsContainer.innerHTML = '';

    // Calculate date range
    const dates = program.tasks.map(task => new Date(task.createdAt));
    const dueDates = program.tasks.map(task => new Date(task.dueDate));
    const allDates = [...dates, ...dueDates];
    
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    
    // Add some padding to the date range
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);
    
    // Set chart dimensions (fixed width for 14 days)
    const chartWidth = 1400; // 14 days * 100px per day
    ganttChart.style.width = `${chartWidth}px`;
    
    // Create a container for the Gantt chart content
    const ganttContent = document.createElement('div');
    ganttContent.className = 'gantt-content';
    ganttChart.appendChild(ganttContent);
    
    // Add current day marker
    const today = new Date();
    if (today >= minDate && today <= maxDate) {
        const todayPosition = ((today - minDate) / (maxDate - minDate)) * 100;
        const currentDayMarker = document.createElement('div');
        currentDayMarker.className = 'current-day-marker';
        currentDayMarker.style.left = `${todayPosition}%`;
        ganttContent.appendChild(currentDayMarker);
    }
    
    // Add day lines
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
        const dayLine = document.createElement('div');
        dayLine.className = 'day-line';
        dayLine.style.left = `${((d - minDate) / (maxDate - minDate)) * 100}%`;
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayLine.setAttribute('data-date', `${dayName}, ${dateStr}`);
        ganttContent.appendChild(dayLine);
    }

    // Add tasks
    program.tasks.forEach((task, index) => {
        const startDate = new Date(task.createdAt);
        const endDate = new Date(task.dueDate);
        
        // Calculate positions
        const startPosition = ((startDate - minDate) / (maxDate - minDate)) * 100;
        const endPosition = ((endDate - minDate) / (maxDate - minDate)) * 100;
        const width = endPosition - startPosition;
        
        // Create task row
        const taskRow = document.createElement('div');
        taskRow.className = 'task-row';
        taskRow.setAttribute('data-task-id', task.id);
        ganttContent.appendChild(taskRow);
        
        // Create task line
        const taskLine = document.createElement('div');
        taskLine.className = 'task-line';
        taskLine.style.left = `${startPosition}%`;
        taskLine.style.width = `${width}%`;
        taskLine.style.backgroundColor = task.color;
        taskRow.appendChild(taskLine);
        
        // Create start marker
        const startMarker = document.createElement('div');
        startMarker.className = 'task-marker';
        startMarker.style.left = `${startPosition}%`;
        startMarker.style.backgroundColor = task.color;
        startMarker.title = `Created: ${new Date(task.createdAt).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        })}`;
        taskRow.appendChild(startMarker);
        
        // Create end marker
        const endMarker = document.createElement('div');
        endMarker.className = 'task-marker due-date';
        endMarker.style.left = `${endPosition}%`;
        endMarker.style.backgroundColor = task.color;
        endMarker.title = `Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        })}`;
        
        // Add percentage display
        const percentageDisplay = document.createElement('div');
        percentageDisplay.className = 'percentage-display';
        percentageDisplay.textContent = `${task.percentageComplete || 0}%`;
        endMarker.appendChild(percentageDisplay);
        
        // Add click event to show task info
        endMarker.addEventListener('click', () => {
            showTaskInfo(task);
        });
        
        taskRow.appendChild(endMarker);
        
        // Add task label to the fixed container
        const taskLabel = document.createElement('div');
        taskLabel.className = 'task-label';
        taskLabel.textContent = task.name;
        taskLabel.style.color = task.color;
        taskLabel.style.marginTop = `${index * 100}px`; // Adjusted spacing to match task row height + margin
        taskLabelsContainer.appendChild(taskLabel);
    });

    // Add reports to task rows
    program.tasks.forEach(task => {
        const taskRow = document.querySelector(`[data-task-id="${task.id}"]`);
        if (!taskRow) return;
        
        const taskReports = program.reports?.filter(r => r.taskId === task.id) || [];
        
        // Group reports by date
        const reportsByDate = {};
        taskReports.forEach(report => {
            const date = new Date(report.createdAt).toLocaleDateString();
            if (!reportsByDate[date]) {
                reportsByDate[date] = [];
            }
            reportsByDate[date].push(report);
        });
        
        // Create report markers and popups
        Object.entries(reportsByDate).forEach(([date, reports]) => {
            // Sort reports by date (newest first)
            reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            const reportMarker = document.createElement('div');
            reportMarker.className = 'report-marker';
            reportMarker.style.left = `${((new Date(reports[0].createdAt) - minDate) / (maxDate - minDate)) * 100}%`;
            
            // Add unchecked count indicator
            const uncheckedCount = reports.filter(report => !report.checked).length;
            if (uncheckedCount > 0) {
                const countIndicator = document.createElement('div');
                countIndicator.className = 'report-count';
                countIndicator.textContent = uncheckedCount;
                reportMarker.appendChild(countIndicator);
            }
            
            // Add checked count indicator
            const checkedCount = reports.filter(report => report.checked).length;
            if (checkedCount > 0) {
                const checkedIndicator = document.createElement('div');
                checkedIndicator.className = 'checked-count';
                checkedIndicator.textContent = checkedCount;
                reportMarker.appendChild(checkedIndicator);
            }
            
            // Create report popup with tabs
            const popup = document.createElement('div');
            popup.className = 'report-popup';
            
            // Create tabs
            const tabsHtml = `
                <div class="report-tabs">
                    ${reports.map((report, index) => `
                        <button class="report-tab ${index === 0 ? 'active' : ''} ${report.checked ? 'checked' : ''}" data-index="${index}">
                            ${report.title}
                            ${report.checked ? '<i class="fas fa-check"></i>' : ''}
                        </button>
                    `).join('')}
                </div>
            `;
            
            // Create content for each report
            const contentsHtml = reports.map((report, index) => `
                <div class="report-content ${index === 0 ? 'active' : ''}">
                    <div class="report-date">${new Date(report.createdAt).toLocaleDateString()}</div>
                    <h4>${report.title}</h4>
                    <div class="report-progress">
                        <span class="progress-label">Progress:</span>
                        <span class="progress-value">${report.percentageComplete}%</span>
                    </div>
                    <p>${report.comment}</p>
                    ${report.photos?.length ? `
                        <div class="report-photos">
                            ${report.photos.map(photo => `
                                <div class="report-photo" onclick="openPhotoPopup('${photo}')">
                                    <img src="${photo}" alt="Report photo">
                                    <div class="photo-overlay">
                                        <i class="fas fa-search-plus"></i>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
            popup.innerHTML = tabsHtml + contentsHtml;
            
            // Add buttons to modal buttons
            const modalButtons = document.createElement('div');
            modalButtons.className = 'modal-buttons';
            modalButtons.innerHTML = `
                <button class="close-button">
                    <i class="fas fa-times"></i>
                    Close
                </button>
                <button class="check-button">
                    <i class="fas fa-check"></i>
                    Checked
                </button>
            `;
            
            popup.appendChild(modalButtons);
            
            // Add close button functionality
            const closeButton = modalButtons.querySelector('.close-button');
            closeButton.addEventListener('click', () => {
                popup.remove();
            });
            
            // Add check button functionality
            const checkButton = modalButtons.querySelector('.check-button');
            checkButton.addEventListener('click', () => {
                const activeTab = popup.querySelector('.report-tab.active');
                const activeIndex = parseInt(activeTab.dataset.index);
                const activeReport = reports[activeIndex];
                
                checkButton.classList.toggle('checked');
                reportMarker.classList.toggle('checked');
                
                // Update the specific report's checked status
                activeReport.checked = checkButton.classList.contains('checked');
                
                // Update checked and unchecked count indicators
                const newCheckedCount = reports.filter(report => report.checked).length;
                const newUncheckedCount = reports.filter(report => !report.checked).length;
                
                // Update or remove checked count indicator
                let checkedIndicator = reportMarker.querySelector('.checked-count');
                if (newCheckedCount > 0) {
                    if (!checkedIndicator) {
                        checkedIndicator = document.createElement('div');
                        checkedIndicator.className = 'checked-count';
                        reportMarker.appendChild(checkedIndicator);
                    }
                    checkedIndicator.textContent = newCheckedCount;
                } else if (checkedIndicator) {
                    checkedIndicator.remove();
                }
                
                // Update or remove unchecked count indicator
                let countIndicator = reportMarker.querySelector('.report-count');
                if (newUncheckedCount > 0) {
                    if (!countIndicator) {
                        countIndicator = document.createElement('div');
                        countIndicator.className = 'report-count';
                        reportMarker.appendChild(countIndicator);
                    }
                    countIndicator.textContent = newUncheckedCount;
                } else if (countIndicator) {
                    countIndicator.remove();
                }
                
                // Save the updated program data
                localStorage.setItem('programs', JSON.stringify(programs));
            });
            
            // Set initial checked state for the active report
            const activeTab = popup.querySelector('.report-tab.active');
            const activeIndex = parseInt(activeTab.dataset.index);
            const activeReport = reports[activeIndex];
            if (activeReport.checked) {
                checkButton.classList.add('checked');
                reportMarker.classList.add('checked');
            }
            
            // Update check button state when switching tabs
            const tabs = popup.querySelectorAll('.report-tab');
            const contents = popup.querySelectorAll('.report-content');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const index = parseInt(tab.dataset.index);
                    
                    // Update active states
                    tabs.forEach(t => t.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));
                    
                    tab.classList.add('active');
                    contents[index].classList.add('active');
                    
                    // Update check button state for the new active report
                    const report = reports[index];
                    if (report.checked) {
                        checkButton.classList.add('checked');
                        reportMarker.classList.add('checked');
                    } else {
                        checkButton.classList.remove('checked');
                        reportMarker.classList.remove('checked');
                    }
                });
            });
            
            // Show popup on click
            reportMarker.addEventListener('click', (e) => {
                e.stopPropagation();
                const allPopups = document.querySelectorAll('.report-popup');
                allPopups.forEach(p => p.remove());
                document.body.appendChild(popup);
            });
            
            // Remove popup when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target === popup) {
                    popup.remove();
                }
            });
            
            taskRow.appendChild(reportMarker);
        });
    });

    // Add scroll controls
    const scrollControls = document.createElement('div');
    scrollControls.className = 'gantt-scroll-controls';
    scrollControls.innerHTML = `
        <button class="scroll-btn prev" title="Scroll left">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="scroll-btn next" title="Scroll right">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    ganttChart.appendChild(scrollControls);

    // Add scroll functionality
    const scrollLeftBtn = scrollControls.querySelector('.prev');
    const scrollRightBtn = scrollControls.querySelector('.next');
    const scrollAmount = chartWidth / 7; // Scroll 7 days at a time

    scrollLeftBtn.addEventListener('click', () => {
        ganttContent.scrollLeft -= scrollAmount;
    });

    scrollRightBtn.addEventListener('click', () => {
        ganttContent.scrollLeft += scrollAmount;
    });
}

// Function to show task info
function showTaskInfo(task) {
    const colorIndicator = taskInfoModal.querySelector('.task-color-indicator');
    const taskName = taskInfoModal.querySelector('.task-name');
    const taskDetails = taskInfoModal.querySelector('.task-details');
    const createdDate = taskInfoModal.querySelector('.created-date');
    const dueDate = taskInfoModal.querySelector('.due-date');
    const taskProgress = taskInfoModal.querySelector('.task-progress');
    
    colorIndicator.style.backgroundColor = task.color;
    taskName.textContent = task.name;
    taskDetails.textContent = task.details || 'No details provided';
    createdDate.textContent = new Date(task.createdAt).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    dueDate.textContent = new Date(task.dueDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    taskProgress.textContent = `${task.percentageComplete || 0}%`;
    
    // Set current task ID
    currentTaskId = task.id;
    
    // Display comments
    const commentsList = taskInfoModal.querySelector('.comments-list');
    commentsList.innerHTML = '';
    
    if (task.comments && task.comments.length > 0) {
        task.comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.name}</span>
                    <span class="comment-date">${new Date(comment.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            `;
            commentsList.appendChild(commentElement);
        });
    } else {
        commentsList.innerHTML = '<div class="no-comments">No comments yet</div>';
    }
    
    // Show the modal
    taskInfoModal.style.display = 'flex';
}

// Add photo popup HTML
const photoPopup = document.createElement('div');
photoPopup.className = 'photo-popup';
photoPopup.style.display = 'none';
photoPopup.innerHTML = `
    <div class="photo-popup-content">
        <button class="close-photo-popup">
            <i class="fas fa-times"></i>
        </button>
        <img src="" alt="Full size photo">
    </div>
`;
document.body.appendChild(photoPopup);

// Add photo popup functionality
window.openPhotoPopup = function(photoUrl) {
    const popup = document.querySelector('.photo-popup');
    const img = popup.querySelector('img');
    img.src = photoUrl;
    popup.style.display = 'flex';
};

// Close photo popup
document.querySelector('.close-photo-popup').addEventListener('click', () => {
    document.querySelector('.photo-popup').style.display = 'none';
});

// Close photo popup when clicking outside
document.querySelector('.photo-popup').addEventListener('click', (e) => {
    if (e.target === document.querySelector('.photo-popup')) {
        document.querySelector('.photo-popup').style.display = 'none';
    }
});

// Add completed tasks section to program view
const completedTasksSection = document.createElement('div');
completedTasksSection.className = 'completed-tasks-section';
completedTasksSection.style.display = 'none';
completedTasksSection.innerHTML = `
    <h3>Completed Tasks</h3>
    <div class="completed-tasks-list"></div>
`;
programView.appendChild(completedTasksSection);

// Add event listener for complete task button
document.getElementById('completeTaskBtn').addEventListener('click', () => {
    if (!currentTaskId || !currentProgramId) return;
    
    const program = programs.find(p => p.id === currentProgramId);
    if (!program) return;
    
    const taskIndex = program.tasks.findIndex(t => t.id === currentTaskId);
    if (taskIndex === -1) return;
    
    // Move task to completed tasks
    const completedTask = program.tasks.splice(taskIndex, 1)[0];
    if (!program.completedTasks) program.completedTasks = [];
    program.completedTasks.push(completedTask);
    
    // Save to localStorage
    localStorage.setItem('programs', JSON.stringify(programs));
    
    // Update UI
    updateGanttChart();
    updateCompletedTasksList();
    
    // Close modal
    taskInfoModal.style.display = 'none';
});

// Function to update completed tasks list
function updateCompletedTasksList() {
    if (!currentProgramId) return;
    
    const program = programs.find(p => p.id === currentProgramId);
    if (!program || !program.completedTasks) return;
    
    const completedTasksList = document.querySelector('.completed-tasks-list');
    completedTasksList.innerHTML = '';
    
    program.completedTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'completed-task';
        taskElement.innerHTML = `
            <div class="task-color-indicator" style="background-color: ${task.color}"></div>
            <div class="task-info">
                <h4>${task.name}</h4>
                <p>${task.details || 'No details'}</p>
                <div class="task-meta">
                    <span>Completed: ${new Date(task.completedAt || new Date()).toLocaleDateString()}</span>
                    <span>Final Progress: ${task.percentageComplete || 0}%</span>
                </div>
            </div>
        `;
        completedTasksList.appendChild(taskElement);
    });
}

// Add event listener for completed button in dropdown
document.getElementById('completedBtn').addEventListener('click', () => {
    const completedTasksSection = document.querySelector('.completed-tasks-section');
    const ganttContainer = document.querySelector('.gantt-container');
    
    if (completedTasksSection.style.display === 'none') {
        completedTasksSection.style.display = 'block';
        ganttContainer.style.display = 'none';
        updateCompletedTasksList();
    } else {
        completedTasksSection.style.display = 'none';
        ganttContainer.style.display = 'block';
    }
});

// Initial view
showProgramSelection();