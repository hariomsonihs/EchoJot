document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const notesList = document.getElementById('notesList');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const searchInput = document.querySelector('.search-input');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const sortBtn = document.getElementById('sortBtn');
    const newNoteContainer = document.getElementById('newNoteContainer');
    const newNoteTitle = document.getElementById('newNoteTitle');
    const newNoteContent = document.getElementById('newNoteContent');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const editNoteContainer = document.getElementById('editNoteContainer');
    const editNoteTitle = document.getElementById('editNoteTitle');
    const editNoteContent = document.getElementById('editNoteContent');
    const saveEditNoteBtn = document.getElementById('saveEditNoteBtn');
    const cancelEditNoteBtn = document.getElementById('cancelEditNoteBtn');
    const toast = document.getElementById('toast');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeOptionsContainer = document.getElementById('themeOptionsContainer');
    
    // View Note Elements
    const viewNoteContainer = document.getElementById('viewNoteContainer');
    const viewNoteTitle = document.getElementById('viewNoteTitle');
    const viewNoteContent = document.getElementById('viewNoteContent');
    const viewNoteImage = document.getElementById('viewNoteImage');
    const viewNoteImageContainer = document.getElementById('viewNoteImageContainer');
    const viewNoteTags = document.getElementById('viewNoteTags');
    const viewNoteDate = document.getElementById('viewNoteDate');
    const viewNoteCategory = document.getElementById('viewNoteCategory');
    const editNoteBtn = document.getElementById('editNoteBtn');
    const closeViewBtn = document.getElementById('closeViewBtn');
    
    // Create save status element
    const saveStatus = document.createElement('div');
    saveStatus.className = 'save-status';
    document.body.appendChild(saveStatus);
    
    // New elements for added features
    const noteCategory = document.getElementById('noteCategory');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newNoteTags = document.getElementById('newNoteTags');
    const editNoteTags = document.getElementById('editNoteTags');
    const pinNoteBtn = document.getElementById('pinNoteBtn');
    const pinEditNoteBtn = document.getElementById('pinEditNoteBtn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Image upload elements
    const imageUploadBtn = document.getElementById('imageUploadBtn');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const editImageUploadBtn = document.getElementById('editImageUploadBtn');
    const editImageInput = document.getElementById('editImageInput');
    const editImagePreview = document.getElementById('editImagePreview');
    const removeEditImageBtn = document.getElementById('removeEditImageBtn');
    
    // Voice note elements
    const voiceNoteBtn = document.getElementById('voiceNoteBtn');
    
    // Modify the app state to track if we're creating a new note
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let noteCounter = notes.length > 0 ? Math.max(...notes.map(note => note.id)) + 1 : 1;
let currentlyEditingId = null;
let currentViewingId = null;
let currentImageDataUrl = null;
let currentEditImageDataUrl = null;
let currentSortMethod = 'newest';
let voiceRecognition = null;
let isRecording = false;
let isSaving = false;
let currentFilter = 'all';
let categories = JSON.parse(localStorage.getItem('categories')) || ['general', 'work', 'personal', 'ideas'];
let autoSaveTimer = null;
let autoSaveDelay = 200; //0.5 seconds
let currentNewNoteId = null; // Add this to track new note being created
let isSelectMode = false;
let selectedNotes = [];
let notesData = []; // Assuming you have an array to store notes
let currentNoteId = null;
    
    // Initialize the app
    initApp();
    
    function initApp() {
        renderNotes(notes);
        setupEventListeners();
        applyTheme(localStorage.getItem('theme') || 'light');
        setupVoiceRecognition();
        updateCategoryDropdown();
        setupAutoSave();
    }
    
    function setupAutoSave() {
        // Auto-save for new note
        newNoteTitle.addEventListener('input', triggerAutoSave);
        newNoteContent.addEventListener('input', triggerAutoSave);
        
        // Auto-save for edit note
        editNoteTitle.addEventListener('input', triggerAutoSave);
        editNoteContent.addEventListener('input', triggerAutoSave);
        
        // Auto-save for image changes
        imageInput.addEventListener('change', triggerAutoSave);
        editImageInput.addEventListener('change', triggerAutoSave);
    }
    
    // Modify triggerAutoSave function
function triggerAutoSave() {
    showSaveStatus('saving');
    
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    autoSaveTimer = setTimeout(() => {
        if (newNoteContainer.classList.contains('active')) {
            saveNewNote(); // This will either create or update the note
        } else if (editNoteContainer.classList.contains('active')) {
            saveEditedNote();
        }
        showSaveStatus('saved');
    }, autoSaveDelay);
}
    
    function showSaveStatus(status) {
        saveStatus.textContent = status === 'saving' ? 'Saving...' : 'Saved';
        saveStatus.className = 'save-status show ' + status;
        
        if (status === 'saved') {
            setTimeout(() => {
                saveStatus.classList.remove('show');
            }, 2000);
        }
    }
    
    function setupEventListeners() {
        // Add new note button
        addNoteBtn.addEventListener('click', openNewNoteEditor);
        
        // Save buttons
        saveNoteBtn.addEventListener('click', handleSaveNote);
        saveEditNoteBtn.addEventListener('click', handleSaveEditNote);
        
        // Cancel buttons
        cancelNoteBtn.addEventListener('click', closeNewNoteEditor);
        cancelEditNoteBtn.addEventListener('click', closeEditNoteEditor);
        
        // Image upload for new note
        imageUploadBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageUpload);
        removeImageBtn.addEventListener('click', removeImage);
        
        // Image upload for edit note
        editImageUploadBtn.addEventListener('click', () => editImageInput.click());
        editImageInput.addEventListener('change', handleEditImageUpload);
        removeEditImageBtn.addEventListener('click', removeEditImage);
        
        // Voice note functionality
        voiceNoteBtn.addEventListener('click', toggleVoiceRecording);
        
        // Search functionality
        searchInput.addEventListener('input', searchNotes);
        clearSearchBtn.addEventListener('click', clearSearch);
        
        // Sort functionality
        sortBtn.addEventListener('click', toggleSortMethod);
        
        // Theme toggle
        themeToggleBtn.addEventListener('click', toggleThemeOptions);
        
        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', function() {
                const theme = this.getAttribute('data-theme');
                applyTheme(theme);
                localStorage.setItem('theme', theme);
                themeOptionsContainer.classList.remove('show');
            });
        });
        
        // Format buttons
        document.querySelectorAll('.format-btn').forEach(button => {
            button.addEventListener('click', handleFormatButton);
        });
        
        // New feature event listeners
        pinNoteBtn.addEventListener('click', togglePinNewNote);
        pinEditNoteBtn.addEventListener('click', togglePinEditNote);
        
        newNoteTags.addEventListener('keydown', handleTagInput);
        editNoteTags.addEventListener('keydown', handleTagInput);
        
        addCategoryBtn.addEventListener('click', addNewCategory);
        
        // Filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterNotes(this.getAttribute('data-filter'));
            });
        });
        
        // Word count updates
        newNoteContent.addEventListener('input', updateWordCount);
        editNoteContent.addEventListener('input', updateWordCount);
    }
    
    function togglePinNewNote() {
        pinNoteBtn.classList.toggle('active');
    }
    
    function togglePinEditNote() {
        pinEditNoteBtn.classList.toggle('active');
    }
    
    function handleTagInput(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tagsInput = e.target;
            const tagsContainer = tagsInput.nextElementSibling;
            const tagText = tagsInput.value.trim();
            
            if (tagText && tagText !== ',') {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.innerHTML = `
                    ${tagText.replace(',', '')}
                    <span class="tag-remove">&times;</span>
                `;
                
                tag.querySelector('.tag-remove').addEventListener('click', function() {
                    tag.remove();
                });
                
                tagsContainer.appendChild(tag);
                tagsInput.value = '';
            }
        }
    }
    
    function getTagsFromContainer(container) {
        return Array.from(container.querySelectorAll('.tag')).map(tag => 
            tag.textContent.replace('×', '').trim()
        );
    }
    
    function addNewCategory() {
        const categoryName = prompt('Enter new category name:');
        if (categoryName && !categories.includes(categoryName.toLowerCase())) {
            categories.push(categoryName.toLowerCase());
            localStorage.setItem('categories', JSON.stringify(categories));
            updateCategoryDropdown();
            showToast(`Category "${categoryName}" added`);
        } else if (categoryName) {
            showToast('Category already exists');
        }
    }
    
    function updateCategoryDropdown() {
        noteCategory.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            noteCategory.appendChild(option);
        });
    }
    
    function filterNotes(filter) {
        currentFilter = filter;
        
        // Update active filter button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');
        
        let filteredNotes = notes;
        
        switch(filter) {
            case 'pinned':
                filteredNotes = notes.filter(note => note.pinned);
                break;
            case 'work':
            case 'personal':
                filteredNotes = notes.filter(note => note.category === filter);
                break;
            case 'archived':
                filteredNotes = notes.filter(note => note.archived);
                break;
            default:
                filteredNotes = notes.filter(note => !note.archived);
        }
        
        renderNotes(filteredNotes);
    }
    
    function updateWordCount() {
        const activeEditor = newNoteContainer.classList.contains('active') ? newNoteContent : editNoteContent;
        const wordCountDisplay = activeEditor.closest('.note-editor-container').querySelector('.word-count');
        
        const text = activeEditor.textContent || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCountDisplay.textContent = `${wordCount} words`;
    }
    
    function toggleThemeOptions(e) {
        if (e) e.preventDefault();
        themeOptionsContainer.classList.toggle('show');
    }
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    
    function handleFormatButton(e) {
        if (e) e.preventDefault();
        const command = this.getAttribute('data-command');
        const value = this.getAttribute('data-value');
        document.execCommand(command, false, value || null);
        const activeEditor = newNoteContainer.classList.contains('active') ? newNoteContent : editNoteContent;
        activeEditor.focus();
    }
    
    function handleSaveNote(e) {
        if (e) e.preventDefault();
        if (isSaving) return;
        isSaving = true;
        
        try {
            saveNewNote(); // कंटेंट सेव होगा
            closeNewNoteEditor(); // सिर्फ मैनुअल सेव पर बंद करें
        } catch (error) {
            console.error('Save error:', error);
            showToast('Error saving note');
        } finally {
            setTimeout(() => {
                isSaving = false;
            }, 1000);
        }
    }
    
    function handleSaveEditNote(e) {
        if (e) e.preventDefault();
        if (isSaving) return;
        isSaving = true;
        
        try {
            saveEditedNote(); // Changes save honge
            closeEditNoteEditor(); // Explicitly close karo
        } catch (error) {
            console.error('Save error:', error);
            showToast('Error saving changes');
        } finally {
            setTimeout(() => {
                isSaving = false;
            }, 1000);
        }
    }
    
    function setupVoiceRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                voiceRecognition = new SpeechRecognition();
                voiceRecognition.continuous = true;
                voiceRecognition.interimResults = true;
                voiceRecognition.lang = 'en-US';
                
                voiceRecognition.onresult = function(event) {
                    const activeEditor = newNoteContainer.classList.contains('active') ? newNoteContent : editNoteContent;
                    let transcript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            transcript += event.results[i][0].transcript;
                        }
                    }
                    
                    if (transcript) {
                        const currentContent = activeEditor.innerHTML;
                        activeEditor.innerHTML = currentContent + (currentContent ? ' ' : '') + transcript;
                    }
                };
                
                voiceRecognition.onerror = function(event) {
                    console.error('Speech recognition error', event.error);
                    showToast('Voice recognition error: ' + event.error);
                    stopVoiceRecording();
                };
            } else {
                voiceNoteBtn.style.display = 'none';
                console.warn('Speech recognition not supported in this browser');
            }
        } catch (e) {
            console.error('Speech recognition initialization error', e);
            voiceNoteBtn.style.display = 'none';
        }
    }
    
    function toggleVoiceRecording(e) {
        if (e) e.preventDefault();
        if (!voiceRecognition) {
            showToast('Voice recognition not supported in your browser');
            return;
        }
        
        if (isRecording) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    }
    
    function startVoiceRecording() {
        try {
            voiceRecognition.start();
            isRecording = true;
            voiceNoteBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Stop Recording';
            voiceNoteBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            showToast('Voice recording started');
        } catch (e) {
            console.error('Error starting voice recognition', e);
            showToast('Error starting voice recording');
        }
    }
    
    function stopVoiceRecording() {
        if (voiceRecognition && isRecording) {
            voiceRecognition.stop();
            isRecording = false;
            voiceNoteBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Note';
            voiceNoteBtn.style.backgroundColor = '';
            showToast('Voice recording stopped');
        }
    }
    
    function openNewNoteEditor(e) {
        if (e) e.preventDefault();
        closeEditNoteEditor();
        closeViewNote();
        newNoteContainer.classList.add('active');
        createOverlay();
        newNoteTitle.value = '';
        newNoteContent.innerHTML = '<p></p>';
        currentImageDataUrl = null;
        imagePreview.style.display = 'none';
        removeImageBtn.style.display = 'none';
        imagePreview.src = '';
        imageInput.value = '';
        pinNoteBtn.classList.remove('active');
        newNoteTags.value = '';
        newNoteTags.nextElementSibling.innerHTML = '';
        currentNewNoteId = null; // Reset when opening new editor
        
        setTimeout(() => {
            newNoteTitle.focus();
            window.scrollTo(0, 0);
        }, 100);
         // Add this for mobile devices
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';
        }, 300);
    }
    }
    
    
    function closeNewNoteEditor(e) {
        if (e) e.preventDefault();
        newNoteContainer.classList.remove('active');
        removeOverlay();
        currentImageDataUrl = null;
        imageInput.value = '';
        currentNewNoteId = null; // Reset when closing
         // Reset for mobile devices
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        document.body.style.height = '';
        document.body.style.overflow = '';
    }
    }
    
    function openViewNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        
        currentViewingId = noteId;
        
        // Set note content
        viewNoteTitle.textContent = note.title;
        viewNoteContent.innerHTML = note.content || '<p>No content</p>';
        
        // Set image
        if (note.image) {
            viewNoteImage.src = note.image;
            viewNoteImage.style.display = 'block';
        } else {
            viewNoteImage.style.display = 'none';
        }
        
        // Set tags
        viewNoteTags.innerHTML = '';
        if (note.tags && note.tags.length > 0) {
            note.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                viewNoteTags.appendChild(tagElement);
            });
        }
        
        // Set date and category
        const date = new Date(note.timestamp);
        viewNoteDate.textContent = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        viewNoteCategory.textContent = note.category || 'general';
        
        // Show view container
        viewNoteContainer.classList.add('active');
        createOverlay();
        
        // Setup edit button
        editNoteBtn.onclick = (e) => {
            e.preventDefault();
            closeViewNote();
            openEditNoteEditor(noteId);
        };
        
        // Setup close button
        closeViewBtn.onclick = (e) => {
            e.preventDefault();
            closeViewNote();
        };
    }
    
    function closeViewNote() {
        viewNoteContainer.classList.remove('active');
        removeOverlay();
        currentViewingId = null;
    }
    
    function openEditNoteEditor(noteId, e) {
        if (e) e.preventDefault();
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        
        currentlyEditingId = noteId;
        editNoteTitle.value = note.title;
        editNoteContent.innerHTML = note.content || '<p></p>';
        
        // Handle image in edit mode
        currentEditImageDataUrl = note.image || null;
        if (note.image) {
            editImagePreview.src = note.image;
            editImagePreview.style.display = 'block';
            removeEditImageBtn.style.display = 'block';
        } else {
            editImagePreview.style.display = 'none';
            removeEditImageBtn.style.display = 'none';
        }
        editImageInput.value = '';
        
        // Handle pinned status
        if (note.pinned) {
            pinEditNoteBtn.classList.add('active');
        } else {
            pinEditNoteBtn.classList.remove('active');
        }
        
        // Handle tags
        editNoteTags.value = '';
        const tagsContainer = editNoteTags.nextElementSibling;
        tagsContainer.innerHTML = '';
        if (note.tags && note.tags.length > 0) {
            note.tags.forEach(tagText => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.innerHTML = `
                    ${tagText}
                    <span class="tag-remove">&times;</span>
                `;
                tag.querySelector('.tag-remove').addEventListener('click', function() {
                    tag.remove();
                });
                tagsContainer.appendChild(tag);
            });
        }
        
        // Hide new note container if open
        closeNewNoteEditor();
        closeViewNote();
        
        // Show edit container
        editNoteContainer.classList.add('active');
        createOverlay();
        
        setTimeout(() => {
            editNoteTitle.focus();
            window.scrollTo(0, 0);
        }, 100);
    }
    
    function closeEditNoteEditor(e) {
        if (e) e.preventDefault();
        editNoteContainer.classList.remove('active');
        removeOverlay();
        currentlyEditingId = null;
        currentEditImageDataUrl = undefined;
        editImageInput.value = '';
    }
    
    function createOverlay() {
        const overlay = document.querySelector('.overlay');
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'overlay active';
            newOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                closeNewNoteEditor();
                closeEditNoteEditor();
                closeViewNote();
            });
            document.body.appendChild(newOverlay);
        }
        // Add this line to prevent background scrolling
    document.body.classList.add('modal-open');
    }
    
    function removeOverlay() {
        const overlay = document.querySelector('.overlay');
        if (overlay) overlay.remove();
        // Add this line to re-enable scrolling
    document.body.classList.remove('modal-open');
    }
    
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentImageDataUrl = event.target.result;
                imagePreview.src = currentImageDataUrl;
                imagePreview.style.display = 'block';
                removeImageBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
    
    function handleEditImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentEditImageDataUrl = event.target.result;
                editImagePreview.src = currentEditImageDataUrl;
                editImagePreview.style.display = 'block';
                removeEditImageBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
    
    function removeImage(e) {
        if (e) e.preventDefault();
        currentImageDataUrl = null;
        imagePreview.style.display = 'none';
        removeImageBtn.style.display = 'none';
        imageInput.value = '';
    }
    
    function removeEditImage(e) {
        if (e) e.preventDefault();
        currentEditImageDataUrl = null;
        editImagePreview.style.display = 'none';
        removeEditImageBtn.style.display = 'none';
        editImageInput.value = '';
    }
    
    // Modify saveNewNote function to update existing note if it exists
function saveNewNote() {
    const title = newNoteTitle.value.trim() || `Note ${notes.length + 1}`;
    const content = newNoteContent.innerHTML.trim() || '<p>Click to edit this note...</p>';
    const tags = getTagsFromContainer(newNoteTags.nextElementSibling);
    
    const noteData = {
        title: title,
        content: content,
        image: currentImageDataUrl,
        category: noteCategory.value,
        tags: tags,
        pinned: pinNoteBtn.classList.contains('active'),
        archived: false,
        timestamp: currentNewNoteId ? notes.find(n => n.id === currentNewNoteId)?.timestamp : new Date().toISOString(),
        lastEdited: new Date().toISOString()
    };

    if (currentNewNoteId) {
        // Update existing note
        const noteIndex = notes.findIndex(n => n.id === currentNewNoteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = { ...notes[noteIndex], ...noteData };
        }
    } else {
        // Create new note
        noteData.id = noteCounter++;
        currentNewNoteId = noteData.id;
        notes.unshift(noteData);
    }
    
    saveNotes();
    renderNotes(notes);
    showToast('Note auto-saved');
    showSaveStatus('saved');
}
    
    function resetNewNoteEditor() {
        newNoteTitle.value = '';
        newNoteContent.innerHTML = '<p></p>';
        currentImageDataUrl = null;
        imagePreview.style.display = 'none';
        removeImageBtn.style.display = 'none';
        pinNoteBtn.classList.remove('active');
        newNoteTags.value = '';
        newNoteTags.nextElementSibling.innerHTML = '';
    }
    
    // फिर saveNewNote() में अंत में इसे कॉल करें:
    resetNewNoteEditor();
    function saveEditedNote() {
        if (!currentlyEditingId) return;
        
        const title = editNoteTitle.value.trim() || `Note ${notes.length + 1}`;
        const content = editNoteContent.innerHTML.trim() || '<p>Click to edit this note...</p>';
        const tags = getTagsFromContainer(editNoteTags.nextElementSibling);
        
        const noteIndex = notes.findIndex(n => n.id === currentlyEditingId);
        if (noteIndex !== -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].content = content;
            notes[noteIndex].lastEdited = new Date().toISOString();
            notes[noteIndex].tags = tags;
            notes[noteIndex].pinned = pinEditNoteBtn.classList.contains('active');
            
            if (currentEditImageDataUrl !== undefined) {
                notes[noteIndex].image = currentEditImageDataUrl;
            }
            
            saveNotes();
            renderNotes(notes);
            showToast('Changes auto-saved');
            showSaveStatus('saved');
            
            // Yeh line hata do jo edit mode close kar rahi thi
            // closeEditNoteEditor(); 
        }
        
        // Isko bhi comment out kar do
        // closeEditNoteEditor();
    }
    
    function deleteNote(noteId, e) {
        if (e) e.preventDefault();
        if (confirm('Are you sure you want to delete this note?')) {
            notes = notes.filter(note => note.id !== noteId);
            saveNotes();
            
            const noteElement = document.querySelector(`.note[data-id="${noteId}"]`);
            if (noteElement) {
                noteElement.classList.add('deleting');
                setTimeout(() => {
                    renderNotes(notes);
                    showToast('Note deleted');
                }, 300);
            }
            
            // If deleting the note being edited, hide the edit container
            if (currentlyEditingId === noteId) {
                closeEditNoteEditor();
            }
            
            // If deleting the note being viewed, hide the view container
            if (currentViewingId === noteId) {
                closeViewNote();
            }
        }
    }
    
    function searchNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm.trim() === '') {
            renderNotes(notes);
            clearSearchBtn.style.display = 'none';
            return;
        }
        
        clearSearchBtn.style.display = 'block';
        
        const filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) || 
            (note.content && note.content.toLowerCase().includes(searchTerm)) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
        
        renderNotes(filteredNotes);
    }
    
    function clearSearch(e) {
        if (e) e.preventDefault();
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        renderNotes(notes);
    }
    
    function toggleSortMethod(e) {
        if (e) e.preventDefault();
        currentSortMethod = currentSortMethod === 'newest' ? 'oldest' : 'newest';
        sortBtn.innerHTML = `<i class="fas fa-sort"></i> ${currentSortMethod === 'newest' ? 'Newest First' : 'Oldest First'}`;
        sortNotes();
    }
    
    function sortNotes() {
        if (currentSortMethod === 'newest') {
            notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else {
            notes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        saveNotes();
        renderNotes(notes);
    }
    
    function renderNotes(notesToRender) {
        // Clear existing notes (except the containers)
        const existingNotes = notesList.querySelectorAll('.note');
        existingNotes.forEach(note => note.remove());
        
        if (notesToRender.length === 0) {
            const noNotesMsg = document.createElement('p');
            noNotesMsg.className = 'no-notes-message';
            noNotesMsg.textContent = searchInput.value.trim() ? 
                'No notes match your search.' : 
                currentFilter === 'all' ? 
                    'No notes found. Click the + button to add a new note.' :
                    `No ${currentFilter} notes found.`;
            notesList.appendChild(noNotesMsg);
            return;
        }
        
        notesToRender.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.setAttribute('data-id', note.id);
            
            if (note.pinned) {
                noteElement.classList.add('pinned');
            }
            
            let imageHtml = '';
            if (note.image) {
                imageHtml = `<img src="${note.image}" class="note-image" alt="Note image">`;
            }
            
            let tagsHtml = '';
            if (note.tags && note.tags.length > 0) {
                tagsHtml = `<div class="note-tags">${note.tags.map(tag => 
                    `<span class="tag">${tag}</span>`
                ).join('')}</div>`;
            }
            
            const date = new Date(note.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            // Truncate content for preview (remove HTML tags)
            const contentPreview = note.content 
                ? note.content.replace(/<[^>]*>/g, ' ').substring(0, 200) 
                : '';
            
            noteElement.innerHTML = `
                ${note.pinned ? '<div class="pin-indicator"><i class="fas fa-thumbtack"></i></div>' : ''}
                <div class="note-title">${note.title}</div>
                ${imageHtml}
                <div class="note-content">${contentPreview}</div>
                ${tagsHtml}
                <div class="note-meta">
                    <span class="note-date">${formattedDate}</span>
                    <span class="note-category">${note.category || 'general'}</span>
                </div>
                <button class="delete-note" data-id="${note.id}"><i class="fas fa-trash"></i></button>
                <button class="archive-note" data-id="${note.id}" title="${note.archived ? 'Unarchive' : 'Archive'}">
                    <i class="fas fa-${note.archived ? 'inbox' : 'archive'}"></i>
                </button>
            `;
            
            notesList.appendChild(noteElement);
            
            // Add click event to view note
            noteElement.addEventListener('click', function(e) {
                handleNoteClick(e, note.id);
            });
            
            // Add delete button event
            const deleteBtn = noteElement.querySelector('.delete-note');
            deleteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                deleteNote(note.id, e);
            });
            
            // Add archive button event
            const archiveBtn = noteElement.querySelector('.archive-note');
            archiveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleArchiveNote(note.id, e);
            });
        });
    }
    
    function handleNoteClick(e, noteId) {
        // Only open editor if clicking on the note content, not delete button or image
        const isDeleteBtn = e.target.classList.contains('delete-note') || 
                          e.target.classList.contains('fa-trash') ||
                          e.target.closest('.delete-note');
        const isArchiveBtn = e.target.classList.contains('archive-note') || 
                           e.target.classList.contains('fa-archive') ||
                           e.target.classList.contains('fa-inbox') ||
                           e.target.closest('.archive-note');
        const isImage = e.target.classList.contains('note-image');
        
        if (!isDeleteBtn && !isArchiveBtn && !isImage) {
            e.preventDefault();
            openViewNote(noteId);
        }
    }
    
    function toggleArchiveNote(noteId, e) {
        const noteIndex = notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1) {
            notes[noteIndex].archived = !notes[noteIndex].archived;
            saveNotes();
            renderNotes(currentFilter === 'all' ? 
                notes.filter(n => !n.archived) : 
                notes.filter(n => n.archived));
            
            showToast(notes[noteIndex].archived ? 'Note archived' : 'Note unarchived');
        }
    }
    
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }
});

// 1. Export Notes Functionality
document.getElementById('exportNotesBtn').addEventListener('click', () => {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    if (notes.length === 0) {
        showToast('No notes to export!');
        return;
    }

    let exportContent = "ZenJot Notes Export\n\n";
    notes.forEach((note, index) => {
        exportContent += `Note ${index + 1}: ${note.title}\n`;
        exportContent += `Category: ${note.category}\n`;
        exportContent += `Content: ${note.content}\n`;
        exportContent += `Tags: ${note.tags.join(', ')}\n`;
        exportContent += `Date: ${note.date}\n\n`;
    });

    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZenJot_Notes_${new Date().toLocaleString().replace(/[,:/]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Notes exported successfully!');
});

// 2. Share Note Functionality
document.getElementById('shareNoteBtn').addEventListener('click', () => {
    const title = document.getElementById('viewNoteTitle').textContent;
    const content = document.getElementById('viewNoteContent').textContent;

    if (navigator.share) {
        navigator.share({
            title: title,
            text: content,
            url: window.location.href
        }).then(() => {
            showToast('Note shared successfully!');
        }).catch((error) => {
            console.error('Error sharing:', error);
            showToast('Failed to share note.');
        });
    } else {
        const shareText = `${title}\n${content}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Note copied to clipboard!');
        }).catch(() => {
            showToast('Failed to copy note.');
        });
    }
});

// 3. Reminder Functionality (New Note)
document.getElementById('setReminderBtn').addEventListener('click', () => {
    const reminderDate = prompt('Enter reminder date and time (e.g., 2025-03-29 14:00):');
    if (reminderDate) {
        const reminderTime = new Date(reminderDate).getTime();
        if (isNaN(reminderTime)) {
            showToast('Invalid date format!');
            return;
        }
        document.getElementById('saveNoteBtn').dataset.reminder = reminderTime;
        showToast(`Reminder set for ${new Date(reminderTime).toLocaleString()}`);
    }
});

// Reminder Functionality (Edit Note)
document.getElementById('editSetReminderBtn').addEventListener('click', () => {
    const reminderDate = prompt('Enter reminder date and time (e.g., 2025-03-29 14:00):');
    if (reminderDate) {
        const reminderTime = new Date(reminderDate).getTime();
        if (isNaN(reminderTime)) {
            showToast('Invalid date format!');
            return;
        }
        document.getElementById('saveEditNoteBtn').dataset.reminder = reminderTime;
        showToast(`Reminder set for ${new Date(reminderTime).toLocaleString()}`);
    }
});

// Check reminders periodically
setInterval(() => {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const now = Date.now();
    notes.forEach((note, index) => {
        if (note.reminder && now >= note.reminder && !note.reminderNotified) {
            showToast(`Reminder: ${note.title}`);
            note.reminderNotified = true;
            localStorage.setItem('notes', JSON.stringify(notes));
        }
    });
}, 60000); // Check every minute

// 4. Note Templates Functionality
document.getElementById('noteTemplate').addEventListener('change', (e) => {
    const template = e.target.value;
    const editor = document.getElementById('newNoteContent');
    editor.innerHTML = '';

    switch (template) {
        case 'meeting':
            editor.innerHTML = `
                <h3>Meeting Notes</h3>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Attendees:</strong></p>
                <ul><li></li></ul>
                <p><strong>Agenda:</strong></p>
                <ol><li></li></ol>
                <p><strong>Action Items:</strong></p>
                <ul><li></li></ul>
            `;
            break;
        case 'todo':
            editor.innerHTML = `
                <h3>To-Do List</h3>
                <ul>
                    <li><input type="checkbox"> Task 1</li>
                    <li><input type="checkbox"> Task 2</li>
                    <li><input type="checkbox"> Task 3</li>
                </ul>
            `;
            break;
        case 'journal':
            editor.innerHTML = `
                <h3>Journal Entry</h3>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Mood:</strong></p>
                <p><strong>Thoughts:</strong></p>
            `;
            break;
        default:
            editor.innerHTML = '';
    }
});

// 5. Auto-Save Functionality
function setupAutoSave(editorId, indicatorId, saveBtnId) {
    const editor = document.getElementById(editorId);
    const indicator = document.getElementById(indicatorId);
    let timeout;

    editor.addEventListener('input', () => {
        indicator.textContent = 'Saving...';
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            indicator.textContent = 'Saved';
            // Your existing save logic should handle the actual saving
            // This just updates the indicator
        }, 1000); // Show "Saved" after 1 second of inactivity
    });
}

// Setup auto-save for both editors
setupAutoSave('newNoteContent', 'autoSaveIndicator', 'saveNoteBtn');
setupAutoSave('editNoteContent', 'editAutoSaveIndicator', 'saveEditNoteBtn');


