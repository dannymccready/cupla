// Store programs and tasks in localStorage
let programs = JSON.parse(localStorage.getItem('programs')) || [];
let currentProgramId = null;

// DOM Elements
const programSelectionView = document.getElementById('programSelectionView');
const programView = document.getElementById('programView');
const programList = document.getElementById('programList');
const programModal = document.getElementById('programModal');
const programForm = document.getElementById('programForm');
const createProgramBtn = document.getElementById('createProgramBtn');
const cancelProgramBtn = document.getElementById('cancelProgramBtn');
const backToProgramsBtn = document.getElementById('backToProgramsBtn');
const currentProgramName = document.getElementById('currentProgramName');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

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
    }
    .task-date {
        display: flex;
        gap: 8px;
    }
    .date-label {
        font-weight: 500;
        color: #666;
    }
`;
document.head.appendChild(style);

// Add event listener for closing task info modal
document.getElementById('closeTaskInfoBtn').addEventListener('click', () => {
    taskInfoModal.style.display = 'none';
});

// Program Management
function showProgramSelection() {
    programSelectionView.style.display = 'block';
    programView.style.display = 'none';
    currentProgramId = null;
    renderProgramList();
}

function showProgramView(programId) {
    programSelectionView.style.display = 'none';
    programView.style.display = 'block';
    currentProgramId = programId;
    const program = programs.find(p => p.id === programId);
    currentProgramName.textContent = program.name;
    updateGanttChart();
}

function renderProgramList() {
    programList.innerHTML = '';
    programs.forEach(program => {
        const programCard = document.createElement('div');
        programCard.className = 'program-card';
        programCard.innerHTML = `
            <h4>${program.name}</h4>
            <p>${program.description || 'No description'}</p>
            <div class="program-stats">
                <span>${program.tasks.length} tasks</span>
            </div>
        `;
        programCard.addEventListener('click', () => showProgramView(program.id));
        programList.appendChild(programCard);
    });
}

// Program Modal Management
createProgramBtn.addEventListener('click', () => {
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
});

backToProgramsBtn.addEventListener('click', showProgramSelection);

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
        createdAt: new Date().toISOString().split('T')[0]
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
    program.tasks.forEach(task => {
        const startDate = new Date(task.createdAt);
        const endDate = new Date(task.dueDate);
        
        // Calculate positions
        const startPosition = ((startDate - minDate) / (maxDate - minDate)) * 100;
        const endPosition = ((endDate - minDate) / (maxDate - minDate)) * 100;
        const width = endPosition - startPosition;
        
        // Create task row
        const taskRow = document.createElement('div');
        taskRow.className = 'task-row';
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
        endMarker.title = `Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        })}`;
        
        // Add click event to show task info
        endMarker.addEventListener('click', () => {
            const colorIndicator = taskInfoModal.querySelector('.task-color-indicator');
            const taskName = taskInfoModal.querySelector('.task-name');
            const taskDetails = taskInfoModal.querySelector('.task-details');
            const createdDate = taskInfoModal.querySelector('.created-date');
            const dueDate = taskInfoModal.querySelector('.due-date');
            
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
            
            taskInfoModal.style.display = 'flex';
        });
        
        taskRow.appendChild(endMarker);
        
        // Add task label
        const taskLabel = document.createElement('div');
        taskLabel.className = 'task-label';
        taskLabel.textContent = task.name;
        taskLabel.style.color = task.color;
        taskRow.appendChild(taskLabel);
    });
}

// Initial view
showProgramSelection(); 