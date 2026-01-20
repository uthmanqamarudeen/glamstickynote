/* ========================================
   GlamStickyNote - Application Logic
   ======================================== */

// ========================================
// State Management
// ========================================
const AppState = {
    notes: [],
    selectedColor: 'yellow',
    currentDate: new Date(),
    selectedDate: null,
    editingNoteId: null,
    currentFilter: 'today', // 'all', 'today', 'upcoming', 'date', 'tag'
    selectedTag: null,
    sortBy: 'date-desc'
};

// ========================================
// DOM Elements (initialized after DOM ready)
// ========================================
let DOM = {};

function initDOM() {
    DOM = {
        // Sidebar
        sidebar: document.getElementById('sidebar'),
        sidebarClose: document.getElementById('sidebarClose'),
        menuToggle: document.getElementById('menuToggle'),
        prevMonth: document.getElementById('prevMonth'),
        nextMonth: document.getElementById('nextMonth'),
        calendarHeader: document.getElementById('calendarHeader'),
        calendarDays: document.getElementById('calendarDays'),
        colorOptions: document.getElementById('colorOptions'),
        tagsPanel: document.getElementById('tagsPanel'),
        tagsList: document.getElementById('tagsList'),

        // Navigation
        navAll: document.getElementById('navAll'),
        navToday: document.getElementById('navToday'),
        navUpcoming: document.getElementById('navUpcoming'),
        navTags: document.getElementById('navTags'),
        navSettings: document.getElementById('navSettings'),
        installApp: document.getElementById('installApp'),

        // Filter
        filterIndicator: document.getElementById('filterIndicator'),
        filterText: document.getElementById('filterText'),
        clearFilter: document.getElementById('clearFilter'),

        // Kanban
        todoNotes: document.getElementById('todoNotes'),
        inprogressNotes: document.getElementById('inprogressNotes'),
        doneNotes: document.getElementById('doneNotes'),
        todoCount: document.getElementById('todoCount'),
        inprogressCount: document.getElementById('inprogressCount'),
        doneCount: document.getElementById('doneCount'),

        // Note Modal
        noteModal: document.getElementById('noteModal'),
        noteForm: document.getElementById('noteForm'),
        modalTitle: document.getElementById('modalTitle'),
        modalClose: document.getElementById('modalClose'),
        cancelNote: document.getElementById('cancelNote'),
        noteId: document.getElementById('noteId'),
        noteColumn: document.getElementById('noteColumn'),
        noteTitle: document.getElementById('noteTitle'),
        noteDescription: document.getElementById('noteDescription'),
        noteDate: document.getElementById('noteDate'),
        noteTags: document.getElementById('noteTags'),
        modalColors: document.getElementById('modalColors'),

        // Settings Modal
        settingsModal: document.getElementById('settingsModal'),
        settingsClose: document.getElementById('settingsClose'),
        exportData: document.getElementById('exportData'),
        importData: document.getElementById('importData'),
        importFile: document.getElementById('importFile'),
        clearAllData: document.getElementById('clearAllData'),

        // Shortcuts Modal
        shortcutsModal: document.getElementById('shortcutsModal'),
        shortcutsClose: document.getElementById('shortcutsClose'),

        // Quick Add
        quickAddInput: document.getElementById('quickAddInput'),

        // Toast
        toastContainer: document.getElementById('toastContainer'),

        // Search & Sort
        searchInput: document.getElementById('searchInput'),
        sortSelect: document.getElementById('sortSelect'),

        // Template
        stickyNoteTemplate: document.getElementById('stickyNoteTemplate')
    };
}

// ========================================
// Utility Functions
// ========================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateISO(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const today = formatDateISO(new Date());
    return dateStr === today;
}

function isFuture(dateStr) {
    if (!dateStr) return false;
    const today = formatDateISO(new Date());
    return dateStr > today;
}

function isOverdue(dateStr, completed) {
    if (!dateStr || completed) return false;
    const today = formatDateISO(new Date());
    return dateStr < today;
}

function isDateMatch(dateStr, targetDate) {
    if (!dateStr || !targetDate) return false;
    return dateStr === formatDateISO(targetDate);
}

function getColumnContainer(column) {
    const containers = {
        'todo': DOM.todoNotes,
        'inprogress': DOM.inprogressNotes,
        'done': DOM.doneNotes
    };
    return containers[column];
}

function getAllTags() {
    const tags = new Set();
    AppState.notes.forEach(note => {
        if (note.tags && note.tags.length > 0) {
            note.tags.forEach(tag => tags.add(tag.toLowerCase().trim()));
        }
    });
    return Array.from(tags).sort();
}

function parseTags(tagString) {
    if (!tagString) return [];
    return tagString.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);
}

// ========================================
// Local Storage
// ========================================
function saveToStorage() {
    localStorage.setItem('glamStickyNotes', JSON.stringify(AppState.notes));
}

function loadFromStorage() {
    const stored = localStorage.getItem('glamStickyNotes');
    if (stored) {
        AppState.notes = JSON.parse(stored);
    } else {
        // Add sample notes for first-time users
        const today = formatDateISO(new Date());
        const tomorrow = formatDateISO(new Date(Date.now() + 86400000));
        const nextWeek = formatDateISO(new Date(Date.now() + 7 * 86400000));

        AppState.notes = [
            {
                id: generateId(),
                title: 'Welcome to GlamStickyNote! ✨',
                description: 'Drag me to another column to change my status!',
                date: today,
                color: 'yellow',
                column: 'todo',
                completed: false,
                tags: ['welcome', 'tutorial']
            },
            {
                id: generateId(),
                title: 'Create your first note',
                description: 'Click the "+ Add Note" button below any column to get started.',
                date: today,
                color: 'mint',
                column: 'todo',
                completed: false,
                tags: ['tutorial']
            },
            {
                id: generateId(),
                title: 'Customize your notes',
                description: 'Pick different colors to organize your tasks beautifully!',
                date: tomorrow,
                color: 'pink',
                column: 'inprogress',
                completed: false,
                tags: ['tutorial', 'design']
            },
            {
                id: generateId(),
                title: 'Plan for next week',
                description: 'Use upcoming view to see future tasks!',
                date: nextWeek,
                color: 'lavender',
                column: 'todo',
                completed: false,
                tags: ['planning']
            }
        ];
        saveToStorage();
    }
}

// ========================================
// Filtering Functions
// ========================================
function setFilter(filterType, value = null) {
    AppState.currentFilter = filterType;
    AppState.selectedTag = filterType === 'tag' ? value : null;
    AppState.selectedDate = filterType === 'date' ? value : null;

    // Update nav active states
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    let filterLabel = '';
    switch (filterType) {
        case 'all':
            DOM.navAll.classList.add('active');
            filterLabel = '';
            break;
        case 'today':
            DOM.navToday.classList.add('active');
            filterLabel = '📅 Today';
            break;
        case 'upcoming':
            DOM.navUpcoming.classList.add('active');
            filterLabel = '📆 Upcoming';
            break;
        case 'tag':
            DOM.navTags.classList.add('active');
            filterLabel = `🏷️ ${value}`;
            break;
        case 'date':
            filterLabel = `📅 ${formatDate(value)}`;
            break;
    }

    // Show/hide filter indicator
    if (filterType === 'all') {
        DOM.filterIndicator.style.display = 'none';
    } else {
        DOM.filterIndicator.style.display = 'flex';
        DOM.filterText.textContent = filterLabel;
    }

    // Show/hide tags panel
    DOM.tagsPanel.style.display = filterType === 'tag' || (filterType === 'all' && getAllTags().length > 0) ? 'block' : 'none';

    renderNotes();
}

function getFilteredNotes(searchQuery = '') {
    let filtered = [...AppState.notes];

    // Apply filter
    switch (AppState.currentFilter) {
        case 'today':
            filtered = filtered.filter(note => isToday(note.date));
            break;
        case 'upcoming':
            filtered = filtered.filter(note => isFuture(note.date));
            break;
        case 'date':
            filtered = filtered.filter(note => isDateMatch(note.date, AppState.selectedDate));
            break;
        case 'tag':
            filtered = filtered.filter(note =>
                note.tags && note.tags.some(t => t.toLowerCase() === AppState.selectedTag.toLowerCase())
            );
            break;
        // 'all' shows everything
    }

    // Apply search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(note =>
            note.title.toLowerCase().includes(query) ||
            (note.description && note.description.toLowerCase().includes(query)) ||
            (note.tags && note.tags.some(t => t.toLowerCase().includes(query)))
        );
    }

    return filtered;
}

// ========================================
// Calendar Functions
// ========================================
function renderCalendar() {
    const year = AppState.currentDate.getFullYear();
    const month = AppState.currentDate.getMonth();

    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    DOM.calendarHeader.textContent = `${monthNames[month]} ${year}`;

    // Get first day and total days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Clear calendar
    DOM.calendarDays.innerHTML = '';

    // Get dates that have notes
    const noteDates = new Set(AppState.notes.filter(n => n.date).map(n => n.date));

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = daysInPrevMonth - i;
        DOM.calendarDays.appendChild(day);
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;

        const dateStr = formatDateISO(new Date(year, month, i));

        // Check if today
        if (year === today.getFullYear() &&
            month === today.getMonth() &&
            i === today.getDate()) {
            day.classList.add('today');
        }

        // Check if has notes
        if (noteDates.has(dateStr)) {
            day.style.fontWeight = '700';
            day.style.color = 'var(--accent-primary)';
        }

        // Check if selected
        if (AppState.selectedDate &&
            year === AppState.selectedDate.getFullYear() &&
            month === AppState.selectedDate.getMonth() &&
            i === AppState.selectedDate.getDate()) {
            day.classList.add('selected');
        }

        day.addEventListener('click', () => {
            const clickedDate = new Date(year, month, i);
            setFilter('date', clickedDate);
            renderCalendar();
        });

        DOM.calendarDays.appendChild(day);
    }

    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        DOM.calendarDays.appendChild(day);
    }
}

// ========================================
// Tags Panel
// ========================================
function renderTagsPanel() {
    const tags = getAllTags();
    DOM.tagsList.innerHTML = '';

    if (tags.length === 0) {
        DOM.tagsList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">No tags yet</span>';
        return;
    }

    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-btn';
        btn.textContent = tag;
        if (AppState.selectedTag === tag) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            if (AppState.selectedTag === tag) {
                setFilter('all');
            } else {
                setFilter('tag', tag);
            }
            renderTagsPanel();
        });
        DOM.tagsList.appendChild(btn);
    });
}

// ========================================
// Note CRUD Operations
// ========================================
function createNoteElement(note) {
    const template = DOM.stickyNoteTemplate.content.cloneNode(true);
    const noteEl = template.querySelector('.sticky-note');

    noteEl.id = `note-${note.id}`;
    noteEl.dataset.id = note.id;
    noteEl.dataset.color = note.color;

    noteEl.querySelector('.note-title').textContent = note.title;
    noteEl.querySelector('.note-description').textContent = note.description || '';

    // Render Priority
    if (note.priority && note.priority !== 'none') {
        const dateEl = noteEl.querySelector('.note-date');
        const badge = document.createElement('span');
        badge.className = `note-priority priority-${note.priority}`;
        badge.textContent = note.priority;
        badge.style.marginRight = '8px';
        dateEl.parentNode.insertBefore(badge, dateEl);
    }

    noteEl.querySelector('.note-date').textContent = formatDate(note.date);

    // Render tags
    const tagsContainer = noteEl.querySelector('.note-tags');
    if (note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'note-tag';
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
    }

    const checkbox = noteEl.querySelector('.note-checkbox');
    const checkboxContainer = noteEl.querySelector('.checkbox-container');
    checkbox.checked = note.completed;
    if (note.completed) {
        noteEl.classList.add('completed');
    }

    // Check if overdue
    if (isOverdue(note.date, note.completed)) {
        noteEl.classList.add('overdue');
    }

    // Prevent drag when clicking checkbox area
    checkboxContainer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        noteEl.setAttribute('draggable', 'false');
    });

    checkboxContainer.addEventListener('mouseup', () => {
        noteEl.setAttribute('draggable', 'true');
    });

    // Handle checkbox change
    checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleNoteComplete(note.id);
    });

    noteEl.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(note.id);
    });
    noteEl.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
    });

    // Drag events
    noteEl.addEventListener('dragstart', handleDragStart);
    noteEl.addEventListener('dragend', handleDragEnd);

    return noteEl;
}

function renderNotes(searchQuery = '') {
    // Clear all containers
    DOM.todoNotes.innerHTML = '';
    DOM.inprogressNotes.innerHTML = '';
    DOM.doneNotes.innerHTML = '';

    // Get filtered notes
    let filteredNotes = getFilteredNotes(searchQuery);

    // Sort notes
    filteredNotes.sort((a, b) => {
        switch (AppState.sortBy) {
            case 'date-desc':
                return (b.date || '').localeCompare(a.date || '');
            case 'date-asc':
                return (a.date || '').localeCompare(b.date || '');
            case 'priority-desc':
                const pMap = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
                const pA = pMap[a.priority || 'medium'] || 0;
                const pB = pMap[b.priority || 'medium'] || 0;
                if (pB !== pA) return pB - pA;
                return (b.date || '').localeCompare(a.date || ''); // Fallback to date
            case 'title-asc':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

    // Check if empty
    if (filteredNotes.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.innerHTML = `
            <div class="empty-state-icon">📝</div>
            <p class="empty-state-text">No notes found</p>
        `;
        DOM.todoNotes.appendChild(emptyMsg);
    }

    // Render notes
    filteredNotes.forEach(note => {
        const container = getColumnContainer(note.column);
        if (container) {
            container.appendChild(createNoteElement(note));
        }
    });

    // Update counts (for filtered view)
    updateCounts(filteredNotes);

    // Update tags panel
    renderTagsPanel();

    // Update calendar highlights
    renderCalendar();
}

function updateCounts(notesToCount = null) {
    const notes = notesToCount || getFilteredNotes();
    const counts = { todo: 0, inprogress: 0, done: 0 };
    notes.forEach(note => {
        if (counts.hasOwnProperty(note.column)) {
            counts[note.column]++;
        }
    });

    DOM.todoCount.textContent = counts.todo;
    DOM.inprogressCount.textContent = counts.inprogress;
    DOM.doneCount.textContent = counts.done;
}

function addNote(noteData) {
    const note = {
        id: generateId(),
        title: noteData.title,
        description: noteData.description || '',
        date: noteData.date || formatDateISO(new Date()),
        color: noteData.color || AppState.selectedColor,
        column: noteData.column || 'todo',
        completed: false,
        tags: noteData.tags || []
    };

    AppState.notes.push(note);
    saveToStorage();
    renderNotes();
}

function updateNote(id, updates) {
    const noteIndex = AppState.notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
        AppState.notes[noteIndex] = { ...AppState.notes[noteIndex], ...updates };
        saveToStorage();
        renderNotes();
    }
}

function deleteNote(id) {
    const note = AppState.notes.find(n => n.id === id);
    if (!note) return;

    const noteEl = document.getElementById(`note-${id}`);
    if (noteEl) {
        noteEl.style.animation = 'noteDisappear 0.3s ease-out forwards';
    }

    // Store deleted note for undo
    const deletedNote = { ...note };

    setTimeout(() => {
        AppState.notes = AppState.notes.filter(n => n.id !== id);
        saveToStorage();
        renderNotes();

        // Show undo toast
        showToast(`"${deletedNote.title}" deleted`, 'Undo', () => {
            // Restore note
            AppState.notes.push(deletedNote);
            saveToStorage();
            renderNotes();
            showToast('Note restored!');
        });
    }, 300);
}

// ========================================
// Toast Notification System
// ========================================
function showToast(message, actionText = null, actionCallback = null, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'toast';

    let html = `<span class="toast-message">${message}</span>`;
    if (actionText && actionCallback) {
        html += `<button class="toast-action">${actionText}</button>`;
    }
    html += `<button class="toast-close">×</button>`;

    toast.innerHTML = html;
    DOM.toastContainer.appendChild(toast);

    // Handle action button
    if (actionText && actionCallback) {
        toast.querySelector('.toast-action').addEventListener('click', () => {
            actionCallback();
            hideToast(toast);
        });
    }

    // Handle close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });

    // Auto-hide after duration
    setTimeout(() => {
        if (toast.parentNode) {
            hideToast(toast);
        }
    }, duration);
}

function hideToast(toast) {
    toast.classList.add('hiding');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 300);
}

function toggleNoteComplete(id) {
    const note = AppState.notes.find(n => n.id === id);
    if (note) {
        note.completed = !note.completed;
        if (note.completed && note.column !== 'done') {
            note.column = 'done';
        }
        saveToStorage();
        renderNotes();
    }
}

function moveNote(id, newColumn) {
    const note = AppState.notes.find(n => n.id === id);
    if (note && note.column !== newColumn) {
        note.column = newColumn;
        if (newColumn === 'done') {
            note.completed = true;
        } else if (note.completed && newColumn !== 'done') {
            note.completed = false;
        }
        saveToStorage();
        renderNotes();
    }
}

// ========================================
// Drag and Drop
// ========================================
let draggedNote = null;

function handleDragStart(e) {
    draggedNote = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.id);

    setTimeout(() => {
        e.target.style.opacity = '0.5';
    }, 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '1';
    draggedNote = null;

    document.querySelectorAll('.notes-container').forEach(container => {
        container.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const container = e.target.closest('.notes-container');
    if (container) {
        container.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const container = e.target.closest('.notes-container');
    if (container && !container.contains(e.relatedTarget)) {
        container.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const container = e.target.closest('.notes-container');
    if (container && draggedNote) {
        const noteId = draggedNote.dataset.id;
        const newColumn = container.dataset.column;
        moveNote(noteId, newColumn);
    }

    document.querySelectorAll('.notes-container').forEach(c => {
        c.classList.remove('drag-over');
    });
}

// ========================================
// Modal Functions
// ========================================
function openModal(column = 'todo') {
    AppState.editingNoteId = null;
    DOM.modalTitle.textContent = 'New Note';
    DOM.noteForm.reset();
    DOM.noteId.value = '';
    DOM.noteColumn.value = column;
    DOM.noteDate.value = formatDateISO(new Date());
    DOM.noteTags.value = '';

    // Reset color selection
    DOM.modalColors.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === AppState.selectedColor);
    });

    // Reset priority (default medium)
    const priorityRadios = DOM.noteForm.querySelectorAll('input[name="priority"]');
    priorityRadios.forEach(radio => radio.checked = (radio.value === 'medium'));

    DOM.noteModal.classList.add('active');
    DOM.noteTitle.focus();
}

function openEditModal(noteId) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (!note) return;

    AppState.editingNoteId = noteId;
    DOM.modalTitle.textContent = 'Edit Note';
    DOM.noteId.value = note.id;
    DOM.noteColumn.value = note.column;
    DOM.noteTitle.value = note.title;
    DOM.noteDescription.value = note.description;
    DOM.noteDate.value = note.date;
    DOM.noteTags.value = note.tags ? note.tags.join(', ') : '';

    // Set color selection
    DOM.modalColors.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === note.color);
    });

    // Set priority
    const priorityRadios = DOM.noteForm.querySelectorAll('input[name="priority"]');
    priorityRadios.forEach(radio => radio.checked = (radio.value === (note.priority || 'medium')));

    DOM.noteModal.classList.add('active');
    DOM.noteTitle.focus();
}

function closeModal() {
    DOM.noteModal.classList.remove('active');
    AppState.editingNoteId = null;
}

function openSettings() {
    DOM.settingsModal.classList.add('active');
}

function closeSettings() {
    DOM.settingsModal.classList.remove('active');
}

// ========================================
// Settings Functions
// ========================================
function exportNotes() {
    const dataStr = JSON.stringify(AppState.notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glamstickynote-backup-${formatDateISO(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importNotes(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                AppState.notes = imported;
                saveToStorage();
                renderNotes();
                closeSettings();
                alert('Notes imported successfully!');
            } else {
                alert('Invalid file format');
            }
        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function clearAllNotes() {
    if (confirm('Are you sure you want to delete ALL notes? This cannot be undone!')) {
        AppState.notes = [];
        saveToStorage();
        renderNotes();
        closeSettings();
    }
}

// ========================================
// Event Listeners
// ========================================
function initEventListeners() {
    // Sidebar toggle
    DOM.menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.sidebar.classList.toggle('open');
        document.body.style.overflow = DOM.sidebar.classList.contains('open') ? 'hidden' : '';
    });

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 &&
            DOM.sidebar.classList.contains('open') &&
            !DOM.sidebar.contains(e.target) &&
            !DOM.menuToggle.contains(e.target)) {
            DOM.sidebar.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // Sidebar close button (mobile)
    DOM.sidebarClose.addEventListener('click', () => {
        DOM.sidebar.classList.remove('open');
        document.body.style.overflow = '';
    });

    // Calendar navigation
    DOM.prevMonth.addEventListener('click', () => {
        AppState.currentDate.setMonth(AppState.currentDate.getMonth() - 1);
        renderCalendar();
    });

    DOM.nextMonth.addEventListener('click', () => {
        AppState.currentDate.setMonth(AppState.currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Quick navigation
    DOM.navAll.addEventListener('click', () => setFilter('all'));
    DOM.navToday.addEventListener('click', () => setFilter('today'));
    DOM.navUpcoming.addEventListener('click', () => setFilter('upcoming'));
    DOM.navTags.addEventListener('click', () => {
        const isHidden = DOM.tagsPanel.style.display === 'none' || DOM.tagsPanel.style.display === '';
        DOM.tagsPanel.style.display = isHidden ? 'block' : 'none';
        DOM.navTags.classList.toggle('active', isHidden);
        if (isHidden) {
            renderTagsPanel(); // Refresh tags when opening
        }
    });
    DOM.navSettings.addEventListener('click', openSettings);

    // Clear filter
    DOM.clearFilter.addEventListener('click', () => setFilter('all'));

    // Sidebar color selection
    DOM.colorOptions.addEventListener('click', (e) => {
        const colorBtn = e.target.closest('.color-btn');
        if (colorBtn) {
            DOM.colorOptions.querySelectorAll('.color-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            colorBtn.classList.add('active');
            AppState.selectedColor = colorBtn.dataset.color;
        }
    });

    // Modal color selection
    DOM.modalColors.addEventListener('click', (e) => {
        const colorBtn = e.target.closest('.color-btn');
        if (colorBtn) {
            DOM.modalColors.querySelectorAll('.color-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            colorBtn.classList.add('active');
        }
    });

    // Add note buttons
    document.querySelectorAll('.add-note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openModal(btn.dataset.column);
        });
    });

    // Note Modal controls
    DOM.modalClose.addEventListener('click', closeModal);
    DOM.cancelNote.addEventListener('click', closeModal);
    DOM.noteModal.addEventListener('click', (e) => {
        if (e.target === DOM.noteModal) closeModal();
    });

    // Settings Modal controls
    DOM.settingsClose.addEventListener('click', closeSettings);
    DOM.settingsModal.addEventListener('click', (e) => {
        if (e.target === DOM.settingsModal) closeSettings();
    });
    DOM.exportData.addEventListener('click', exportNotes);
    DOM.importData.addEventListener('click', () => DOM.importFile.click());
    DOM.importFile.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importNotes(e.target.files[0]);
        }
    });
    DOM.clearAllData.addEventListener('click', clearAllNotes);

    // Form submission
    DOM.noteForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const activeColor = DOM.modalColors.querySelector('.color-btn.active');
        const priorityInput = DOM.noteForm.querySelector('input[name="priority"]:checked');

        const noteData = {
            title: DOM.noteTitle.value.trim(),
            description: DOM.noteDescription.value.trim(),
            date: DOM.noteDate.value,
            color: activeColor ? activeColor.dataset.color : 'yellow',
            priority: priorityInput ? priorityInput.value : 'medium',
            column: DOM.noteColumn.value,
            tags: parseTags(DOM.noteTags.value)
        };

        if (AppState.editingNoteId) {
            updateNote(AppState.editingNoteId, noteData);
        } else {
            addNote(noteData);
        }

        closeModal();
    });

    // Drag and drop on containers
    document.querySelectorAll('.notes-container').forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });

    // Search
    DOM.searchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    // Sort
    DOM.sortSelect.addEventListener('change', (e) => {
        AppState.sortBy = e.target.value;
        renderNotes(DOM.searchInput.value);
    });

    // Quick Add
    DOM.quickAddInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && DOM.quickAddInput.value.trim()) {
            addNote({
                title: DOM.quickAddInput.value.trim(),
                column: 'todo',
                date: formatDateISO(new Date())
            });
            DOM.quickAddInput.value = '';
            showToast('Note added to To Do!');
        }
    });

    // Shortcuts Modal
    DOM.shortcutsClose.addEventListener('click', () => {
        DOM.shortcutsModal.classList.remove('active');
    });
    DOM.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === DOM.shortcutsModal) {
            DOM.shortcutsModal.classList.remove('active');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts if typing in an input
        const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);

        if (e.key === 'Escape') {
            if (DOM.noteModal.classList.contains('active')) closeModal();
            if (DOM.settingsModal.classList.contains('active')) closeSettings();
            if (DOM.shortcutsModal.classList.contains('active')) {
                DOM.shortcutsModal.classList.remove('active');
            }
        }

        // Ctrl+N: New note
        if (e.key === 'n' && e.ctrlKey) {
            e.preventDefault();
            openModal();
        }

        // Only trigger these if not typing
        if (!isTyping) {
            // /: Focus quick add
            if (e.key === '/') {
                e.preventDefault();
                DOM.quickAddInput.focus();
            }

            // ?: Show shortcuts help
            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                DOM.shortcutsModal.classList.add('active');
            }

            // A: All notes
            if (e.key === 'a' || e.key === 'A') {
                setFilter('all');
            }

            // T: Today
            if (e.key === 't' || e.key === 'T') {
                setFilter('today');
            }

            // U: Upcoming
            if (e.key === 'u' || e.key === 'U') {
                setFilter('upcoming');
            }
        }
    });
}

// ========================================
// Add disappear animation to CSS dynamically
// ========================================
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes noteDisappear {
            from {
                opacity: 1;
                transform: scale(1) rotate(0);
            }
            to {
                opacity: 0;
                transform: scale(0.5) rotate(10deg);
            }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// Initialize App
// ========================================
function init() {
    initDOM(); // Initialize DOM references first
    addDynamicStyles();
    loadFromStorage();
    renderCalendar();
    setFilter('today'); // Start with today's view
    initEventListeners();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.log('Service Worker registration failed', err));
    }

    // PWA Installation
    // PWA Installation
    let deferredPrompt;

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Show button immediately on iOS
    if (isIOS) {
        DOM.installApp.style.display = 'flex';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        DOM.installApp.style.display = 'flex';
        console.log('PWA install prompt ready');
    });

    DOM.installApp.addEventListener('click', async () => {
        // iOS Instructions
        if (isIOS) {
            showToast('To install: Tap Share ⬆️ → Add to Home Screen ➕', 'info');
            return;
        }

        // Android/Desktop Prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredPrompt = null;
                DOM.installApp.style.display = 'none';
            }
            return;
        }

        // Fallback
        showToast('Install this app via your browser menu', 'info');
    });

    // Hide button if installed
    window.addEventListener('appinstalled', () => {
        DOM.installApp.style.display = 'none';
        deferredPrompt = null;
        console.log('PWA installed successfully');
    });

    console.log('✨ GlamStickyNote initialized!');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
