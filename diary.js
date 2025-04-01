// Store users and projects
let users = [];
let projects = [];

// DOM Elements
const diaryView = document.getElementById('diaryView');
const userManagementView = document.getElementById('userManagementView');
const projectManagementView = document.getElementById('projectManagementView');
const userManagementList = document.getElementById('userManagementList');
const projectManagementList = document.getElementById('projectManagementList');
const userDetailsContent = document.getElementById('userDetailsContent');
const projectDetailsContent = document.getElementById('projectDetailsContent');
const userModal = document.getElementById('userModal');
const projectModal = document.getElementById('projectModal');
const userForm = document.getElementById('userForm');
const projectForm = document.getElementById('projectForm');
const manageUsersBtn = document.getElementById('manageUsersBtn');
const manageProjectsBtn = document.getElementById('manageProjectsBtn');
const addUserBtn = document.getElementById('addUserBtn');
const addProjectBtn = document.getElementById('addProjectBtn');
const cancelUserBtn = document.getElementById('cancelUserBtn');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const backToDiaryBtn = document.getElementById('backToDiaryBtn');
const backToDiaryBtn2 = document.getElementById('backToDiaryBtn2');

// Event Listeners
manageUsersBtn.addEventListener('click', showUserManagement);
manageProjectsBtn.addEventListener('click', showProjectManagement);
addUserBtn.addEventListener('click', showAddUserModal);
addProjectBtn.addEventListener('click', showAddProjectModal);
cancelUserBtn.addEventListener('click', hideAddUserModal);
cancelProjectBtn.addEventListener('click', hideAddProjectModal);
backToDiaryBtn.addEventListener('click', showDiaryView);
backToDiaryBtn2.addEventListener('click', showDiaryView);
userForm.addEventListener('submit', handleUserSubmit);
projectForm.addEventListener('submit', handleProjectSubmit);

// View Management
function showUserManagement() {
    diaryView.style.display = 'none';
    projectManagementView.style.display = 'none';
    userManagementView.style.display = 'flex';
    updateUserList();
}

function showProjectManagement() {
    diaryView.style.display = 'none';
    userManagementView.style.display = 'none';
    projectManagementView.style.display = 'flex';
    updateProjectList();
}

function showDiaryView() {
    diaryView.style.display = 'flex';
    userManagementView.style.display = 'none';
    projectManagementView.style.display = 'none';
}

// User Management
function showAddUserModal() {
    userModal.style.display = 'block';
    userForm.reset();
}

function hideAddUserModal() {
    userModal.style.display = 'none';
}

function handleUserSubmit(event) {
    event.preventDefault();
    
    const newUser = {
        id: Date.now(), // Simple unique ID
        name: document.getElementById('userName').value,
        role: document.getElementById('userRole').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value
    };
    
    users.push(newUser);
    updateUserList();
    hideAddUserModal();
}

function updateUserList() {
    userManagementList.innerHTML = '';
    
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'list-item';
        userItem.innerHTML = `
            <i class="fas fa-user"></i>
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-role">${user.role}</div>
            </div>
        `;
        
        userItem.addEventListener('click', () => showUserDetails(user));
        userManagementList.appendChild(userItem);
    });
}

function showUserDetails(user) {
    // Remove active class from all items
    document.querySelectorAll('.list-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    event.currentTarget.classList.add('active');
    
    // Show user details
    userDetailsContent.innerHTML = `
        <div class="user-details">
            <div class="detail-group">
                <label>Name</label>
                <p>${user.name}</p>
            </div>
            <div class="detail-group">
                <label>Role</label>
                <p>${user.role}</p>
            </div>
            <div class="detail-group">
                <label>Email</label>
                <p>${user.email}</p>
            </div>
            <div class="detail-group">
                <label>Phone</label>
                <p>${user.phone || 'Not provided'}</p>
            </div>
        </div>
    `;
}

// Project Management
function showAddProjectModal() {
    projectModal.style.display = 'block';
    projectForm.reset();
}

function hideAddProjectModal() {
    projectModal.style.display = 'none';
}

function handleProjectSubmit(event) {
    event.preventDefault();
    
    const newProject = {
        id: Date.now(), // Simple unique ID
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        status: 'Active',
        createdDate: new Date().toISOString().split('T')[0]
    };
    
    projects.push(newProject);
    updateProjectList();
    hideAddProjectModal();
}

function updateProjectList() {
    projectManagementList.innerHTML = '';
    
    projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'list-item';
        projectItem.innerHTML = `
            <i class="fas fa-project-diagram"></i>
            <div class="project-info">
                <div class="project-name">${project.name}</div>
                <div class="project-status">${project.status}</div>
            </div>
        `;
        
        projectItem.addEventListener('click', () => showProjectDetails(project));
        projectManagementList.appendChild(projectItem);
    });
}

function showProjectDetails(project) {
    // Remove active class from all items
    document.querySelectorAll('.list-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    event.currentTarget.classList.add('active');
    
    // Show project details
    projectDetailsContent.innerHTML = `
        <div class="project-details">
            <div class="detail-group">
                <label>Project Name</label>
                <p>${project.name}</p>
            </div>
            <div class="detail-group">
                <label>Description</label>
                <p>${project.description}</p>
            </div>
            <div class="detail-group">
                <label>Status</label>
                <p>${project.status}</p>
            </div>
            <div class="detail-group">
                <label>Created Date</label>
                <p>${project.createdDate}</p>
            </div>
        </div>
    `;
}

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === userModal) {
        hideAddUserModal();
    }
    if (event.target === projectModal) {
        hideAddProjectModal();
    }
}); 