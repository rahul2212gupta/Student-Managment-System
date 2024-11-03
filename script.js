// Initialize variables
let students = JSON.parse(localStorage.getItem('students')) || [];
let currentEditId = null;

// DOM Elements
const studentForm = document.getElementById('studentForm');
const studentList = document.getElementById('studentList');
const searchInput = document.getElementById('searchInput');
const submitBtn = document.getElementById('submitBtn');
const emptyState = document.getElementById('emptyState');
const confirmationModal = document.getElementById('confirmationModal');
const loadingOverlay = document.getElementById('loadingOverlay');

// Toast Configuration
const toastTypes = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    displayStudents();
    updateStatistics();
    setupEventListeners();
}

function setupEventListeners() {
    studentForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
    document.querySelector('.close-btn')?.addEventListener('click', closeModal);
    document.getElementById('cancelAction')?.addEventListener('click', closeModal);
    document.getElementById('confirmAction')?.addEventListener('click', handleConfirmAction);
}

// Form Handling
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;

    showLoading();
    
    try {
        const studentData = {
            id: currentEditId || Date.now().toString(),
            name: document.getElementById('name').value,
            roll: document.getElementById('roll').value,
            age: parseInt(document.getElementById('age').value),
            grade: document.getElementById('grade').value,
            email: document.getElementById('email').value
        };

        if (currentEditId) {
            updateStudent(studentData);
            showToast('Student updated successfully!', toastTypes.SUCCESS);
        } else {
            addStudent(studentData);
            showToast('Student added successfully!', toastTypes.SUCCESS);
        }

        resetForm();
        displayStudents();
        updateStatistics();
    } catch (error) {
        showToast(error.message, toastTypes.ERROR);
    } finally {
        hideLoading();
    }
}

function validateForm() {
    const name = document.getElementById('name').value;
    const roll = document.getElementById('roll').value;
    const age = parseInt(document.getElementById('age').value);
    const email = document.getElementById('email').value;

    if (name.length < 2) {
        showToast('Name must be at least 2 characters long', toastTypes.ERROR);
        return false;
    }

    if (age < 5 || age > 100) {
        showToast('Age must be between 5 and 100', toastTypes.ERROR);
        return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showToast('Please enter a valid email address', toastTypes.ERROR);
        return false;
    }

    // Check for duplicate roll number
    const existingStudent = students.find(student => 
        student.roll === roll && student.id !== currentEditId
    );
    
    if (existingStudent) {
        showToast('Roll number already exists!', toastTypes.ERROR);
        return false;
    }

    return true;
}

// Student CRUD Operations
function addStudent(studentData) {
    students.push(studentData);
    saveToLocalStorage();
}

function updateStudent(studentData) {
    const index = students.findIndex(student => student.id === studentData.id);
    if (index !== -1) {
        students[index] = studentData;
        saveToLocalStorage();
    }
}

function deleteStudent(id) {
    students = students.filter(student => student.id !== id);
    saveToLocalStorage();
    displayStudents();
    updateStatistics();
    showToast('Student deleted successfully!', toastTypes.SUCCESS);
}

// Display and UI Operations
function displayStudents(filteredStudents = null) {
    const displayData = filteredStudents || students;
    
    if (displayData.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();
    
    const tbody = studentList.querySelector('tbody');
    tbody.innerHTML = displayData.map(student => `
        <tr>
            <td>${student.name}</td>
            <td>${student.roll}</td>
            <td>${student.age}</td>
            <td>${student.grade}</td>
            <td>${student.email}</td>
            <td>
                <button onclick="editStudent('${student.id}')" class="btn btn-edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmDelete('${student.id}')" class="btn btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function editStudent(id) {
    const student = students.find(student => student.id === id);
    if (!student) return;

    currentEditId = id;
    document.getElementById('name').value = student.name;
    document.getElementById('roll').value = student.roll;
    document.getElementById('age').value = student.age;
    document.getElementById('grade').value = student.grade;
    document.getElementById('email').value = student.email;
    
    submitBtn.textContent = 'Update Student';
    document.getElementById('formTitle').textContent = 'Edit Student';
}

function confirmDelete(id) {
    currentEditId = id;
    confirmationModal.classList.remove('hidden');
}

function handleConfirmAction() {
    if (currentEditId) {
        deleteStudent(currentEditId);
        closeModal();
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.roll.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm)
    );
    displayStudents(filteredStudents);
}

// Statistics Update
function updateStatistics() {
    document.getElementById('totalStudents').textContent = students.length;
    
    const averageAge = students.length 
        ? (students.reduce((sum, student) => sum + student.age, 0) / students.length).toFixed(1)
        : 0;
    document.getElementById('averageAge').textContent = averageAge;
    
    const gradeDistribution = students.reduce((acc, student) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
    }, {});
    document.getElementById('topGrade').textContent = 
        Object.entries(gradeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
}

// Utility Functions
function saveToLocalStorage() {
    localStorage.setItem('students', JSON.stringify(students));
}

function resetForm() {
    currentEditId = null;
    studentForm.reset();
    submitBtn.textContent = 'Add Student';
    document.getElementById('formTitle').textContent = 'Add New Student';
}

function showEmptyState() {
    emptyState.classList.remove('hidden');
    studentList.classList.add('hidden');
}

function hideEmptyState() {
    emptyState.classList.add('hidden');
    studentList.classList.remove('hidden');
}

function closeModal() {
    confirmationModal.classList.add('hidden');
    currentEditId = null;
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Toast Notifications
function showToast(message, type = toastTypes.INFO) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case toastTypes.SUCCESS: return 'fa-check-circle';
        case toastTypes.ERROR: return 'fa-exclamation-circle';
        case toastTypes.WARNING: return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}