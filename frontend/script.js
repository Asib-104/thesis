// Configuration
const CONFIG = {
    SERVER_URL: 'http://localhost:5000',
    PARAGRAPH_API: 'https://api.myjson.online/v1/records/5ee18fa0-1358-4b62-8434-349637cfbd39',
    MAX_FILE_SIZE: 50 * 1024 * 1024 // 50MB
};

// DOM Elements
const form = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');
const categorySelect = document.getElementById('category');
const paragraphTextarea = document.getElementById('paragraph');
const audioFileInput = document.getElementById('audioFile');

// State
let paragraphsData = [];

// Utility Functions
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
    submitBtn.disabled = show;
    
    const btnText = submitBtn.querySelector('span');
    const btnIcon = submitBtn.querySelector('i');
    
    if (show) {
        btnText.textContent = 'Processing...';
        btnIcon.className = 'fas fa-spinner fa-spin';
    } else {
        btnText.textContent = 'Upload & Process Audio';
        btnIcon.className = 'fas fa-upload';
    }
}



// API Functions
async function fetchParagraphsData() {
    try {
        const response = await fetch(CONFIG.PARAGRAPH_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.data && data.data.messages && Array.isArray(data.data.messages)) {
            paragraphsData = data.data.messages;
            return true;
        } else {
            throw new Error('Invalid data structure received from API');
        }
    } catch (error) {
        console.error('Error fetching paragraphs:', error);
        showMessage('Failed to load paragraphs. Please check your internet connection.', 'error');
        return false;
    }
}

function getRandomParagraph() {
    if (paragraphsData.length === 0) {
        showMessage('No paragraphs available. Please try loading again.', 'error');
        return '';
    }
    
    const randomIndex = Math.floor(Math.random() * paragraphsData.length);
    return paragraphsData[randomIndex].data;
}

async function loadRandomParagraph() {
    if (paragraphsData.length === 0) {
        const success = await fetchParagraphsData();
        if (!success) return;
    }
    
    const randomParagraph = getRandomParagraph();
    paragraphTextarea.value = randomParagraph;
}

// Validation Functions
function validateForm() {
    const category = categorySelect.value;
    const paragraph = paragraphTextarea.value.trim();
    const audioFile = audioFileInput.files[0];
    
    if (!category) {
        showMessage('Please select a category.', 'error');
        categorySelect.focus();
        return false;
    }
    
    if (!paragraph) {
        showMessage('No paragraph available. Please refresh the page.', 'error');
        return false;
    }
    
    if (!audioFile) {
        showMessage('Please select an audio file.', 'error');
        audioFileInput.focus();
        return false;
    }
    
    if (!audioFile.type.startsWith('audio/')) {
        showMessage('Please select a valid audio file.', 'error');
        audioFileInput.focus();
        return false;
    }
    
    if (audioFile.size > CONFIG.MAX_FILE_SIZE) {
        showMessage('File size too large. Please select a file smaller than 50MB.', 'error');
        audioFileInput.focus();
        return false;
    }
    
    return true;
}

// Upload Function
async function uploadData() {
    if (!validateForm()) return;
    
    const formData = new FormData();
    formData.append('category', categorySelect.value);
    formData.append('paragraph', paragraphTextarea.value);
    formData.append('audioFile', audioFileInput.files[0]);
    
    showLoading(true);
    
    try {
        const response = await fetch(`${CONFIG.SERVER_URL}/data/save`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Data uploaded successfully!', 'success');
            resetForm();
        } else {
            showMessage(result.message || 'Upload failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showMessage('Cannot connect to server. Please check if the server is running and try again.', 'error');
        } else {
            showMessage('Network error. Please try again.', 'error');
        }
    } finally {
        showLoading(false);
    }
}

function resetForm() {
    categorySelect.value = '';
    paragraphTextarea.value = '';
    audioFileInput.value = '';
}

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    uploadData();
});

audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith('audio/')) {
        showMessage('Please select a valid audio file.', 'error');
        e.target.value = '';
    } else if (file && file.size > CONFIG.MAX_FILE_SIZE) {
        showMessage('File size too large. Please select a file smaller than 50MB.', 'error');
        e.target.value = '';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Auto-load a random paragraph when the page loads
    loadRandomParagraph();
    
    // Add smooth animations
    const container = document.querySelector('.container');
    const header = document.querySelector('.header');
    
    // Animate elements on load
    setTimeout(() => {
        header.classList.add('fade-in');
    }, 200);
    
    setTimeout(() => {
        container.classList.add('slide-up');
    }, 400);
    
    // Add ripple effect to submit button
    submitBtn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = this.querySelector('.btn-ripple');
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
    });
    
    // Enhanced file upload area
    const fileUploadArea = document.querySelector('.file-upload-area');
    const fileInput = document.getElementById('audioFile');
    
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--primary-color)';
        fileUploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = 'var(--border-color)';
        fileUploadArea.style.background = 'var(--bg-secondary)';
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--border-color)';
        fileUploadArea.style.background = 'var(--bg-secondary)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateFileDisplay(files[0]);
        }
    });
    
    // Update file display when file is selected
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            updateFileDisplay(file);
        }
    });
});

// Function to update file display
function updateFileDisplay(file) {
    const fileUploadArea = document.querySelector('.file-upload-area');
    const existingDisplay = fileUploadArea.querySelector('.file-selected');
    
    if (existingDisplay) {
        existingDisplay.remove();
    }
    
    const fileDisplay = document.createElement('div');
    fileDisplay.className = 'file-selected';
    fileDisplay.innerHTML = `
        <i class="fas fa-file-audio" style="color: var(--success-color); font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <p style="color: var(--success-color); font-weight: 600;">${file.name}</p>
        <small style="color: var(--text-secondary);">${(file.size / (1024 * 1024)).toFixed(2)} MB</small>
    `;
    
    fileUploadArea.appendChild(fileDisplay);
    fileUploadArea.style.borderColor = 'var(--success-color)';
    fileUploadArea.style.background = 'rgba(16, 185, 129, 0.05)';
}