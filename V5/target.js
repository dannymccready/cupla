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
            <button class="secondary-button" id="closeTaskInfoBtn">Close</button>
        </div>
    </div>
`;
document.body.appendChild(taskInfoModal);

// Add styles for task info modal
const style = document.createElement('style');
style.textContent = `
    .task-info-content {
        padding: 20px 0;
    }
    .task-info-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }
    .task-color-indicator {
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }
    .task-name {
        margin: 0;
        font-size: 20px;
    }
    .task-details {
        margin-bottom: 20px;
        color: #666;
        line-height: 1.5;
    }
    .task-dates {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 24px;
    }
    .task-date {
        display: flex;
        gap: 8px;
    }
    .date-label {
        font-weight: 500;
        color: #666;
    }
    .task-comments {
        border-top: 1px solid #eee;
        padding-top: 20px;
    }
    .comments-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    .comments-header h4 {
        margin: 0;
        font-size: 16px;
        color: #333;
    }
    .comments-list {
        margin-bottom: 16px;
    }
    .comment {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
    }
    .comment-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
    }
    .comment-author {
        font-weight: 500;
        color: #333;
    }
    .comment-date {
        font-size: 12px;
        color: #666;
    }
    .comment-text {
        color: #666;
        line-height: 1.5;
    }
    .comment-form {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
    }
    .comment-form .form-group {
        margin-bottom: 16px;
    }
    .comment-form label {
        display: block;
        margin-bottom: 8px;
        color: #333;
        font-weight: 500;
    }
    .comment-form input,
    .comment-form textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }
    .comment-form textarea {
        min-height: 80px;
        resize: vertical;
    }
    .task-marker {
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        cursor: pointer;
        transition: transform 0.2s ease;
        z-index: 2;
    }

    .task-marker:hover {
        transform: translate(-50%, -50%) scale(1.2);
    }

    .task-marker.due-date {
        width: 40px;
        height: 40px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: 500;
    }

    .task-marker.due-date:hover {
        transform: translate(-50%, -50%) scale(1.1);
    }

    .percentage-display {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .task-marker:hover .percentage-display {
        opacity: 1;
    }

    .report-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 12px 0;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 6px;
        width: fit-content;
    }
    .progress-label {
        color: #666;
        font-weight: 500;
    }
    .progress-value {
        color: #333;
        font-weight: 600;
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
    
    programs.forEach(program => {
        const programCard = document.createElement('div');
        programCard.className = 'program-card';
        
        // Calculate total reports and reports added today
        const totalReports = program.reports ? program.reports.length : 0;
        const today = new Date().toISOString().split('T')[0];
        const reportsToday = program.reports ? program.reports.filter(report => 
            report.createdAt.split('T')[0] === today
        ).length : 0;
        
        programCard.innerHTML = `
            <h4>${program.name}</h4>
            <p>${program.description || 'No description'}</p>
            <div class="program-stats">
                <div class="stats-row">
                    <span>${program.tasks.length} tasks</span>
                    <span>${totalReports} reports</span>
                </div>
                <div class="stats-row">
                    <span>${reportsToday} reports today</span>
                </div>
            </div>
        `;
        programCard.addEventListener('click', () => showProgramView(program.id));
        programList.appendChild(programCard);
    });
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
        tasks: []
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
    
    // Create report object
    const report = {
        id: Date.now().toString(),
        title,
        comment,
        taskId: parseInt(taskId),
        createdAt: new Date().toISOString(),
        photos: [],
        percentageComplete: percentage
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
    
    // Calculate total days
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    // Set chart dimensions (fixed width for 14 days)
    const chartWidth = 1400; // 14 days * 100px per day
    ganttChart.style.width = `${chartWidth}px`;
    
    // Add current day marker
    const today = new Date();
    if (today >= minDate && today <= maxDate) {
        const todayPosition = ((today - minDate) / (maxDate - minDate)) * 100;
        const currentDayMarker = document.createElement('div');
        currentDayMarker.className = 'current-day-marker';
        currentDayMarker.style.left = `${todayPosition}%`;
        ganttChart.appendChild(currentDayMarker);
    }
    
    // Add day lines
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
        const dayLine = document.createElement('div');
        dayLine.className = 'day-line';
        dayLine.style.left = `${((d - minDate) / (maxDate - minDate)) * 100}%`;
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayLine.setAttribute('data-date', `${dayName}, ${dateStr}`);
        ganttChart.appendChild(dayLine);
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
        ganttChart.appendChild(taskRow);
        
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
        endMarker.textContent = `${task.percentageComplete || 0}%`;
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
            
            // Create report popup with tabs
            const popup = document.createElement('div');
            popup.className = 'report-popup';
            
            // Create tabs
            const tabsHtml = `
                <div class="report-tabs">
                    ${reports.map((report, index) => `
                        <button class="report-tab ${index === 0 ? 'active' : ''}" data-index="${index}">
                            ${report.title}
                        </button>
                    `).join('')}
                </div>
            `;
            
            // Create content sections
            const contentHtml = reports.map((report, index) => `
                <div class="report-content ${index === 0 ? 'active' : ''}">
                    <div class="report-date">${new Date(report.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                    <h4>${report.title}</h4>
                    <div class="report-progress">
                        <span class="progress-label">Progress:</span>
                        <span class="progress-value">${report.percentageComplete}%</span>
                    </div>
                    <p>${report.comment}</p>
                    ${report.photos.length ? `
                        <div class="report-photos">
                            ${report.photos.map(photo => `
                                <div class="report-photo">
                                    <img src="${photo}" alt="Report photo">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
            popup.innerHTML = `
                ${tabsHtml}
                ${contentHtml}
                <div class="modal-buttons">
                    <button class="secondary-button" onclick="this.closest('.report-popup').remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            `;
            
            // Add tab switching functionality
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
}

// Initial view
showProgramSelection();