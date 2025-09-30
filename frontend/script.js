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
    submitBtn.textContent = show ? 'Uploading...' : 'Upload Data';
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
});