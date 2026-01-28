/* ========================================
   GlamStickyNote - Application Logic
   ======================================== */

// ========================================
// App Configuration
// ========================================
const APP_VERSION = '1.0.0';

// ========================================
// State Management
// ========================================
const AppState = {
    notes: [],
    selectedColor: 'yellow',
    currentDate: new Date(),
    selectedDate: null,
    editingNoteId: null,
    currentFilter: 'today', // 'all', 'today', 'upcoming', 'date', 'tag', 'overdue', 'high-priority', 'this-week'
    selectedTag: null,
    sortBy: 'date-desc',
    // History tracking
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    // Bulk operations
    selectMode: false,
    selectedNoteIds: new Set()
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
        smartFilters: document.getElementById('smartFilters'),
        filterOverdue: document.getElementById('filterOverdue'),
        filterHighPriority: document.getElementById('filterHighPriority'),
        filterThisWeek: document.getElementById('filterThisWeek'),

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
        noteTime: document.getElementById('noteTime'),
        noteTags: document.getElementById('noteTags'),
        noteRecurrence: document.getElementById('noteRecurrence'),
        modalColors: document.getElementById('modalColors'),

        // Settings Modal
        settingsModal: document.getElementById('settingsModal'),
        settingsClose: document.getElementById('settingsClose'),
        exportData: document.getElementById('exportData'),
        exportCSV: document.getElementById('exportCSV'),
        importData: document.getElementById('importData'),
        importFile: document.getElementById('importFile'),
        clearAllData: document.getElementById('clearAllData'),

        // Shortcuts Modal
        shortcutsModal: document.getElementById('shortcutsModal'),
        shortcutsClose: document.getElementById('shortcutsClose'),

        // Quick Add
        quickAddInput: document.getElementById('quickAddInput'),

        // Manual Install Modal
        installModal: document.getElementById('install-modal'),
        installClose: document.getElementById('installClose'),
        installGotIt: document.getElementById('installGotIt'),

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

function formatDate(date, time = null) {
    if (!date) return '';
    const d = new Date(date);
    let str = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    if (time) {
        // Convert 24h to 12h
        const [hours, mins] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        str += `, ${h12}:${mins} ${ampm}`;
    }
    return str;
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
// Smart Filter Helper Functions
// ========================================
function isOverdue(note) {
    if (!note.date || note.completed) return false;
    const today = formatDateISO(new Date());
    return note.date < today;
}

function isHighPriority(note) {
    return note.priority === 'high';
}

function isThisWeek(note) {
    if (!note.date) return false;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

    const noteDate = new Date(note.date);
    return noteDate >= startOfWeek && noteDate <= endOfWeek;
}

function countSmartFilters() {
    const overdueCount = AppState.notes.filter(isOverdue).length;
    const highPriorityCount = AppState.notes.filter(isHighPriority).length;
    const thisWeekCount = AppState.notes.filter(isThisWeek).length;

    return { overdueCount, highPriorityCount, thisWeekCount };
}

function updateSmartFilterCounts() {
    const { overdueCount, highPriorityCount, thisWeekCount } = countSmartFilters();

    const filterPills = [
        { elem: DOM.filterOverdue, count: overdueCount },
        { elem: DOM.filterHighPriority, count: highPriorityCount },
        { elem: DOM.filterThisWeek, count: thisWeekCount }
    ];

    filterPills.forEach(({ elem, count }) => {
        if (elem) {
            elem.querySelector('.filter-count').textContent = count;
            elem.classList.toggle('has-items', count > 0);
        }
    });
}

// ========================================
// Recurring Tasks Helper Functions
// ========================================
function getNextOccurrenceDate(currentDate, recurrence) {
    const date = new Date(currentDate);
    switch (recurrence) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        default:
            return null;
    }
    return formatDateISO(date);
}

function createNextOccurrence(note) {
    if (!note.recurrence || note.recurrence === 'none') {
        return null;
    }

    const nextDate = getNextOccurrenceDate(note.date, note.recurrence);
    if (!nextDate) return null;

    const newNote = {
        id: generateId(),
        title: note.title,
        description: note.description,
        date: nextDate,
        color: note.color,
        column: 'todo',
        completed: false,
        priority: note.priority || 'medium',
        tags: note.tags || [],
        recurrence: note.recurrence
    };

    return newNote;
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
                priority: 'medium',
                tags: ['welcome', 'tutorial'],
                recurrence: 'none'
            },
            {
                id: generateId(),
                title: 'Create your first note',
                description: 'Click the "+ Add Note" button below any column to get started.',
                date: today,
                color: 'mint',
                column: 'todo',
                completed: false,
                priority: 'high',
                tags: ['tutorial'],
                recurrence: 'none'
            },
            {
                id: generateId(),
                title: 'Customize your notes',
                description: 'Pick different colors to organize your tasks beautifully!',
                date: tomorrow,
                color: 'pink',
                column: 'inprogress',
                completed: false,
                priority: 'medium',
                tags: ['tutorial', 'design'],
                recurrence: 'none'
            },
            {
                id: generateId(),
                title: 'Plan for next week',
                description: 'Use upcoming view to see future tasks!',
                date: nextWeek,
                color: 'lavender',
                column: 'todo',
                completed: false,
                priority: 'low',
                tags: ['planning'],
                recurrence: 'none'
            }
        ];
        saveToStorage();
    }
}

// ========================================
// History / Undo-Redo System
// ========================================
function pushHistory(action, description) {
    // Remove any redo history if we're making a new action
    if (AppState.historyIndex < AppState.history.length - 1) {
        AppState.history = AppState.history.slice(0, AppState.historyIndex + 1);
    }

    // Create history entry
    const entry = {
        action,
        description,
        notesSnapshot: JSON.parse(JSON.stringify(AppState.notes))
    };

    AppState.history.push(entry);
    AppState.historyIndex = AppState.history.length - 1;

    // Limit history size
    if (AppState.history.length > AppState.maxHistorySize) {
        AppState.history.shift();
        AppState.historyIndex--;
    }
}

function undo() {
    if (AppState.historyIndex < 0) {
        showToast('Nothing to undo', 'info', null, 2000);
        return;
    }

    AppState.historyIndex--;
    const historyEntry = AppState.history[AppState.historyIndex];

    AppState.notes = JSON.parse(JSON.stringify(historyEntry.notesSnapshot));
    saveToStorage();
    renderNotes();

    showToast(`↩️ Undone: ${historyEntry.description}`, 'success', null, 2000);
}

function redo() {
    if (AppState.historyIndex >= AppState.history.length - 1) {
        showToast('Nothing to redo', 'info', null, 2000);
        return;
    }

    AppState.historyIndex++;
    const historyEntry = AppState.history[AppState.historyIndex];

    AppState.notes = JSON.parse(JSON.stringify(historyEntry.notesSnapshot));
    saveToStorage();
    renderNotes();

    showToast(`↪️ Redone: ${historyEntry.description}`, 'success', null, 2000);
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
        case 'overdue':
            filterLabel = '🔴 Overdue';
            break;
        case 'high-priority':
            filterLabel = '⭐ High Priority';
            break;
        case 'this-week':
            filterLabel = '📆 This Week';
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

// ========================================
// Bulk Operations Functions
// ========================================
function toggleSelectMode() {
    AppState.selectMode = !AppState.selectMode;
    AppState.selectedNoteIds.clear();
    renderNotes();
    updateBulkActionBar();
}

function toggleNoteSelection(id) {
    if (AppState.selectedNoteIds.has(id)) {
        AppState.selectedNoteIds.delete(id);
    } else {
        AppState.selectedNoteIds.add(id);
    }
    updateBulkActionBar();
}

function selectAllFiltered() {
    const filtered = getFilteredNotes(DOM.searchInput.value);
    AppState.selectedNoteIds.clear();
    filtered.forEach(note => AppState.selectedNoteIds.add(note.id));
    updateBulkActionBar();
    renderNotes();
}

function clearSelection() {
    AppState.selectedNoteIds.clear();
    updateBulkActionBar();
    renderNotes();
}

function bulkDeleteNotes() {
    const count = AppState.selectedNoteIds.size;
    if (count === 0) return;

    if (!confirm(`Delete ${count} note${count > 1 ? 's' : ''}?`)) return;

    AppState.notes = AppState.notes.filter(n => !AppState.selectedNoteIds.has(n.id));
    saveToStorage();
    pushHistory('bulk-delete', `Deleted ${count} note${count > 1 ? 's' : ''}`);
    showToast(`🗑️ Deleted ${count} note${count > 1 ? 's' : ''}`, 'success', null, 2000);

    AppState.selectedNoteIds.clear();
    AppState.selectMode = false;
    renderNotes();
    updateBulkActionBar();
}

function bulkMoveNotes(newColumn) {
    const count = AppState.selectedNoteIds.size;
    if (count === 0) return;

    AppState.notes.forEach(note => {
        if (AppState.selectedNoteIds.has(note.id)) {
            note.column = newColumn;
            if (newColumn === 'done') {
                note.completed = true;
            } else if (note.completed && newColumn !== 'done') {
                note.completed = false;
            }
        }
    });

    saveToStorage();
    const columnNames = { 'todo': 'To Do', 'inprogress': 'In Progress', 'done': 'Done' };
    pushHistory('bulk-move', `Moved ${count} note${count > 1 ? 's' : ''} to ${columnNames[newColumn]}`);
    showToast(`➡️ Moved ${count} note${count > 1 ? 's' : ''} to ${columnNames[newColumn]}`, 'success', null, 2000);

    AppState.selectedNoteIds.clear();
    renderNotes();
    updateBulkActionBar();
}

function bulkColorNotes(color) {
    const count = AppState.selectedNoteIds.size;
    if (count === 0) return;

    AppState.notes.forEach(note => {
        if (AppState.selectedNoteIds.has(note.id)) {
            note.color = color;
        }
    });

    saveToStorage();
    pushHistory('bulk-color', `Changed color of ${count} note${count > 1 ? 's' : ''}`);
    showToast(`🎨 Changed color of ${count} note${count > 1 ? 's' : ''}`, 'success', null, 2000);

    renderNotes();
    updateBulkActionBar();
}

function updateBulkActionBar() {
    const bar = document.getElementById('bulkActionBar');
    if (!bar) return;

    if (AppState.selectMode && AppState.selectedNoteIds.size > 0) {
        bar.style.display = 'flex';
        bar.querySelector('.selection-count').textContent = `${AppState.selectedNoteIds.size} selected`;
    } else {
        bar.style.display = 'none';
    }
}

// ========================================
// Quick Edit Inline Functions
// ========================================
function enableQuickEdit(noteEl, noteId) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (!note || AppState.selectMode) return;

    const titleEl = noteEl.querySelector('.note-title');
    const descEl = noteEl.querySelector('.note-description');

    // Create editable inputs
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'note-title-input';
    titleInput.value = note.title;

    const descInput = document.createElement('textarea');
    descInput.className = 'note-description-input';
    descInput.value = note.description || '';

    // Replace elements
    titleEl.replaceWith(titleInput);
    descEl.replaceWith(descInput);

    titleInput.focus();
    titleInput.select();

    function saveEdit() {
        const newTitle = titleInput.value.trim();
        const newDesc = descInput.value.trim();

        if (newTitle) {
            updateNote(noteId, {
                title: newTitle,
                description: newDesc
            });
        } else {
            // Cancel if title is empty
            renderNotes();
        }
    }

    function cancelEdit() {
        renderNotes();
    }

    // Save on blur
    titleInput.addEventListener('blur', saveEdit);
    descInput.addEventListener('blur', saveEdit);

    // Save on Enter (title only), Escape to cancel
    titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            descInput.focus();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });

    descInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        } else if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            saveEdit();
        }
    });
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
        case 'overdue':
            filtered = filtered.filter(isOverdue);
            break;
        case 'high-priority':
            filtered = filtered.filter(isHighPriority);
            break;
        case 'this-week':
            filtered = filtered.filter(isThisWeek);
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
        const isToday = year === today.getFullYear() &&
            month === today.getMonth() &&
            i === today.getDate();

        if (isToday) {
            day.classList.add('today');
        }

        // Check if has notes (don't override today's white text)
        if (noteDates.has(dateStr) && !isToday) {
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

    noteEl.querySelector('.note-date').textContent = formatDate(note.date, note.time);

    // Render recurrence badge
    const recurrenceEl = noteEl.querySelector('.note-recurrence');
    if (note.recurrence && note.recurrence !== 'none') {
        const recurrenceLabel = {
            'daily': '🔄 Daily',
            'weekly': '🔄 Weekly',
            'monthly': '🔄 Monthly'
        }[note.recurrence];
        recurrenceEl.textContent = recurrenceLabel;
        recurrenceEl.style.display = 'inline';
        recurrenceEl.style.fontSize = '0.7rem';
        recurrenceEl.style.marginLeft = '8px';
        recurrenceEl.style.opacity = '0.8';
    }

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

    // Add select mode checkbox overlay
    if (AppState.selectMode) {
        const selectCheckbox = document.createElement('input');
        selectCheckbox.type = 'checkbox';
        selectCheckbox.className = 'note-select-checkbox';
        selectCheckbox.checked = AppState.selectedNoteIds.has(note.id);
        selectCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        selectCheckbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleNoteSelection(note.id);
            updateBulkActionBar();
        });
        noteEl.appendChild(selectCheckbox);

        if (AppState.selectedNoteIds.has(note.id)) {
            noteEl.classList.add('selected-for-bulk');
        }
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

    // Quick Edit - double-click to edit inline
    const titleEl = noteEl.querySelector('.note-title');
    const descEl = noteEl.querySelector('.note-description');

    titleEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        enableQuickEdit(noteEl, note.id);
    });

    descEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        enableQuickEdit(noteEl, note.id);
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

    // Update smart filter counts
    updateSmartFilterCounts();

    // Get filtered notes
    let filteredNotes = getFilteredNotes(searchQuery);

    // Sort notes
    filteredNotes.sort((a, b) => {
        const dateA = (a.date || '') + (a.time || '00:00');
        const dateB = (b.date || '') + (b.time || '00:00');

        switch (AppState.sortBy) {
            case 'date-desc':
                return dateB.localeCompare(dateA);
            case 'date-asc':
                return dateA.localeCompare(dateB);
            case 'priority-desc':
                const pMap = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
                const pA = pMap[a.priority || 'medium'] || 0;
                const pB = pMap[b.priority || 'medium'] || 0;
                if (pB !== pA) return pB - pA;
                return dateB.localeCompare(dateA); // Fallback to date
            case 'title-asc':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

    // Check if empty global (e.g. search found nothing)
    if (filteredNotes.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <p class="empty-state-text">${searchQuery ? `No matches for "${searchQuery}"` : 'No notes found'}</p>
        `;
        // Append to Todo column as fallback, or maybe we should hide columns? 
        // For simplicity, just showing it in Todo is fine, or all of them.
        DOM.todoNotes.appendChild(emptyMsg);
        return;
    }

    // Render notes
    filteredNotes.forEach(note => {
        const container = getColumnContainer(note.column);
        if (container) {
            container.appendChild(createNoteElement(note));
        }
    });

    // Check individual columns
    if (DOM.todoNotes.children.length === 0) {
        DOM.todoNotes.appendChild(createEmptyState('todo'));
    }
    if (DOM.inprogressNotes.children.length === 0) {
        DOM.inprogressNotes.appendChild(createEmptyState('doing'));
    }
    if (DOM.doneNotes.children.length === 0) {
        DOM.doneNotes.appendChild(createEmptyState('done'));
    }


    function createEmptyState(type) {
        const el = document.createElement('div');
        el.className = 'empty-state';

        let icon = ICONS.edit;
        let text = 'No notes';

        switch (type) {
            case 'todo':
                icon = ICONS.check;
                text = 'All caught up!';
                break;
            case 'doing':
                icon = ICONS.clock;
                text = 'Nothing in progress';
                break;
            case 'done':
                icon = ICONS.star;
                text = 'No completed tasks yet';
                break;
        }

        el.innerHTML = `
        <div class="empty-state-icon">${icon}</div>
        <p class="empty-state-text">${text}</p>
    `;
        return el;
    }

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
        time: noteData.time || '',
        color: noteData.color || AppState.selectedColor,
        column: noteData.column || 'todo',
        completed: false,
        priority: noteData.priority || 'medium',
        tags: noteData.tags || [],
        recurrence: noteData.recurrence || 'none'
    };

    AppState.notes.push(note);
    saveToStorage();
    pushHistory('add', `Added: "${note.title}"`);
    showToast(`${ICONS.check} Added: "${note.title}"`, 'success', null, 2000);
    renderNotes();
}

function updateNote(id, updates) {
    const noteIndex = AppState.notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
        const oldTitle = AppState.notes[noteIndex].title;
        AppState.notes[noteIndex] = { ...AppState.notes[noteIndex], ...updates };
        saveToStorage();
        pushHistory('edit', `Edited: "${oldTitle}"`);
        showToast(`${ICONS.edit} Edited: "${oldTitle}"`, 'success', null, 2000);
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

    setTimeout(() => {
        AppState.notes = AppState.notes.filter(n => n.id !== id);
        saveToStorage();
        pushHistory('delete', `Deleted: "${note.title}"`);
        showToast(`${ICONS.trash} Deleted: "${note.title}"`, 'success', null, 2000);
        renderNotes();
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

            // If recurring, create next occurrence
            if (note.recurrence && note.recurrence !== 'none') {
                const nextNote = createNextOccurrence(note);
                if (nextNote) {
                    AppState.notes.push(nextNote);
                    showToast(`✅ Next occurrence created: ${formatDate(nextNote.date)}`, 'success');
                }
            }
        }
        saveToStorage();
        pushHistory('toggle', `${note.completed ? 'Completed' : 'Reopened'}: "${note.title}"`);
        showToast(`${note.completed ? ICONS.check + ' Completed' : ICONS.refresh + ' Reopened'}: "${note.title}"`, 'success', null, 2000);
        renderNotes();
    }
}

function moveNote(id, newColumn) {
    const note = AppState.notes.find(n => n.id === id);
    if (note && note.column !== newColumn) {
        const oldColumn = note.column;
        note.column = newColumn;
        if (newColumn === 'done') {
            note.completed = true;
        } else if (note.completed && newColumn !== 'done') {
            note.completed = false;
        }
        saveToStorage();

        const columnNames = { 'todo': 'To Do', 'inprogress': 'In Progress', 'done': 'Done' };
        pushHistory('move', `Moved "${note.title}" to ${columnNames[newColumn]}`);
        showToast(`${ICONS.arrowRight} Moved "${note.title}" to ${columnNames[newColumn]}`, 'success', null, 2000);
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
    DOM.noteColumn.value = column;
    DOM.noteDate.value = formatDateISO(new Date());
    DOM.noteTime.value = '';
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
    DOM.noteTime.value = note.time || '';
    DOM.noteTags.value = note.tags ? note.tags.join(', ') : '';
    DOM.noteRecurrence.value = note.recurrence || 'none';

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

function exportToCSV() {
    if (!AppState.notes || AppState.notes.length === 0) {
        showToast('⚠️ No notes to export.', 'warning');
        return;
    }

    // Define headers
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Tags', 'Color'];

    // Create CSV rows
    const csvRows = [headers.join(',')];

    AppState.notes.forEach(note => {
        const row = [
            `"${(note.title || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(note.description || '').replace(/"/g, '""')}"`,
            note.column,
            note.priority,
            note.date || '',
            `"${(note.tags || []).join(';')}"`, // Semicolon separate tags
            note.color
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `glamstickynote_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('📊 CSV Export successful!', 'success');
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
        pushHistory('clear', 'Cleared all notes');
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

    // Bulk Operations
    const selectModeBtn = document.getElementById('selectModeBtn');
    const mobileBulkFab = document.getElementById('mobileBulkFab');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const bulkColorBtn = document.getElementById('bulkColorBtn');
    const bulkMoveBtn = document.getElementById('bulkMoveBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const cancelSelectBtn = document.getElementById('cancelSelectBtn');

    if (selectModeBtn) {
        selectModeBtn.addEventListener('click', () => {
            toggleSelectMode();
            selectModeBtn.classList.toggle('active', AppState.selectMode);
        });
    }

    if (mobileBulkFab) {
        mobileBulkFab.addEventListener('click', () => {
            toggleSelectMode();
            mobileBulkFab.classList.toggle('active', AppState.selectMode);
        });
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllFiltered);
    }

    if (bulkColorBtn) {
        bulkColorBtn.addEventListener('click', () => {
            const color = prompt('Enter color (yellow, pink, mint, lavender, coral):');
            if (color && ['yellow', 'pink', 'mint', 'lavender', 'coral'].includes(color)) {
                bulkColorNotes(color);
            }
        });
    }

    if (bulkMoveBtn) {
        bulkMoveBtn.addEventListener('click', () => {
            const column = prompt('Enter column (todo, inprogress, done):');
            if (column && ['todo', 'inprogress', 'done'].includes(column)) {
                bulkMoveNotes(column);
            }
        });
    }

    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', bulkDeleteNotes);
    }

    if (cancelSelectBtn) {
        cancelSelectBtn.addEventListener('click', () => {
            AppState.selectMode = false;
            AppState.selectedNoteIds.clear();
            if (selectModeBtn) selectModeBtn.classList.remove('active');
            if (mobileBulkFab) mobileBulkFab.classList.remove('active');
            renderNotes();
            updateBulkActionBar();
        });
    }

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

    // Smart Filters
    DOM.filterOverdue.addEventListener('click', () => setFilter('overdue'));
    DOM.filterHighPriority.addEventListener('click', () => setFilter('high-priority'));
    DOM.filterThisWeek.addEventListener('click', () => setFilter('this-week'));

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
    DOM.exportCSV.addEventListener('click', exportToCSV);
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
            tags: parseTags(DOM.noteTags.value),
            recurrence: DOM.noteRecurrence.value || 'none'
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

    // Install Modal
    if (DOM.installClose) {
        DOM.installClose.addEventListener('click', closeInstallModal);
        DOM.installGotIt.addEventListener('click', closeInstallModal);
        DOM.installModal.addEventListener('click', (e) => {
            if (e.target === DOM.installModal) closeInstallModal();
        });
    }

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

        // Ctrl+Z: Undo
        if (e.key === 'z' && e.ctrlKey && !isTyping) {
            e.preventDefault();
            undo();
        }

        // Ctrl+Y or Ctrl+Shift+Z: Redo
        if ((e.key === 'y' && e.ctrlKey || e.key === 'z' && e.ctrlKey && e.shiftKey) && !isTyping) {
            e.preventDefault();
            redo();
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

function openInstallModal() {
    const modal = document.getElementById('install-modal');
    if (modal) {
        modal.classList.add('active');
    } else {
        // Last resort fallback
        alert('To install this app:\n1. Tap the browser menu (⋮)\n2. Select "Install App"');
    }
}

function closeInstallModal() {
    if (DOM.installModal) {
        DOM.installModal.classList.remove('active');
    }
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
// Notification System
// ========================================
function initNotifications() {
    const toggle = document.getElementById('notificationToggle');
    if (!toggle) return;

    // Load saved preference
    const isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    toggle.checked = isEnabled;

    toggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
            // Request permission
            if (!('Notification' in window)) {
                showToast(`${ICONS.alert} This browser does not support notifications.`, 'error');
                e.target.checked = false;
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                localStorage.setItem('notificationsEnabled', 'true');
                checkReminders(); // Check immediately
                showToast(`${ICONS.bell} Notifications enabled!`, 'success');

                // Welcome notification
                new Notification('GlamStickyNote', {
                    body: 'You will now be notified of tasks due today.',
                    icon: 'assets/icon-192.png'
                });
            } else {
                e.target.checked = false;
                showToast(`${ICONS.alert} Permission denied. Please enable in browser settings.`, 'error');
            }
        } else {
            localStorage.setItem('notificationsEnabled', 'false');
            showToast(`${ICONS.bellOff} Notifications disabled.`, 'neutral');
        }
    });

    // Check on load if enabled
    if (isEnabled && 'Notification' in window && Notification.permission === 'granted') {
        checkReminders();
    }

    // Check minutely for precise notifications
    setInterval(() => {
        if (localStorage.getItem('notificationsEnabled') === 'true') {
            checkReminders();
        }
    }, 60 * 1000);
}

function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const today = formatDateISO(now);
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;

    // Get notes due today that haven't been notified yet this minute
    const notesDue = AppState.notes.filter(note => {
        const isActive = note.column === 'todo' || note.column === 'inprogress';
        if (!isActive) return false;

        // Date check
        if (note.date !== today) return false;

        // Time check
        if (note.time) {
            return note.time === currentTime;
        } else {
            // For notes without time, notify at 9:00 AM once
            return currentTime === '09:00';
        }
    });

    if (notesDue.length === 0) return;

    // Avoid duplicate notifications for the same note/time
    // We use session-based tracking or simple timestamp check
    const lastCheck = sessionStorage.getItem('lastNotificationTime');
    if (lastCheck === currentTime) return;

    notesDue.forEach(note => {
        try {
            new Notification('GlamStickyNote', {
                body: `It's time for: ${note.title} ⏰`,
                icon: 'assets/icon-192.png',
                tag: `reminder-${note.id}`,
                requireInteraction: true
            });
        } catch (e) {
            console.error('Notification failed:', e);
        }
    });

    sessionStorage.setItem('lastNotificationTime', currentTime);
}

// ========================================
// Splash Screen Logic
// ========================================
function handleSplashScreen() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    // Minimum display time of 1.5 seconds for branding effect
    setTimeout(() => {
        splash.classList.add('fade-out');

        // Remove from DOM after transition matches CSS (0.5s)
        setTimeout(() => {
            splash.remove();
        }, 500);
    }, 1500);
}

// ========================================
// Initialize App
// ========================================
function init() {
    initDOM(); // Initialize DOM references first
    addDynamicStyles();
    loadFromStorage();
    handleSplashScreen(); // Show loading screen

    // Display app version in settings
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
        versionElement.textContent = `v${APP_VERSION}`;
    }

    // Initialize history with current state
    pushHistory('init', 'App initialized');

    renderCalendar();
    setFilter('today'); // Start with today's view
    initEventListeners();
    initNotifications(); // Initialize notifications logic

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => { })
            .catch(err => console.error('Service Worker registration failed', err));
    }

    // PWA Installation with Enhanced Debugging
    let deferredPrompt;
    let installPromptFired = false;

    // Helper function to detect iOS
    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    // Helper function to detect Android
    function isAndroid() {
        return /Android/i.test(navigator.userAgent);
    }

    // Check if already running as installed PWA
    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    // Detect any mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Don't show install button if already installed
    if (isStandalone()) {
        DOM.installApp.style.display = 'none';
    } else if (isMobile) {
        // Show button immediately on mobile (will update text based on platform)
        DOM.installApp.style.display = 'flex';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installPromptFired = true;
        DOM.installApp.style.display = 'flex';
    });

    DOM.installApp.addEventListener('click', async () => {
        // Check if already installed
        if (isStandalone()) {
            showToast(`${ICONS.check} App is already installed!`, 'success');
            DOM.installApp.style.display = 'none';
            return;
        }

        // iOS Instructions - check at click time
        if (isIOS()) {
            showToast(`${ICONS.share} iOS: Tap Share button ⬆️ → Add to Home Screen`, 'info', null, 5000);
            return;
        }

        // Android/Desktop Prompt
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    showToast(`${ICONS.check} App installed successfully!`, 'success');
                    deferredPrompt = null;
                    DOM.installApp.style.display = 'none';
                } else {
                    showToast(`${ICONS.x} Installation cancelled`, 'info');
                }
            } catch (error) {
                console.error('Error showing install prompt:', error);
                showToast(`${ICONS.alert} Unable to show install prompt. Try via browser menu.`, 'warning', null, 4000);
            }
            return;
        }

        // Fallback: No prompt available
        // Check if it's an HTTPS issue
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && !location.hostname.startsWith('192.168')) {
            showToast(`${ICONS.alert} PWA requires HTTPS. Please access via https:// or use ngrok/similar tool`, 'warning', null, 6000);
            return;
        }

        // Platform-specific fallback
        if (isAndroid()) {
            openInstallModal(); // Show manual instructions instead of generic toast
        } else {
            showToast('💡 Access browser menu to install this app touch', 'info', null, 4000);
        }
    });

    // Hide button if installed
    window.addEventListener('appinstalled', () => {
        DOM.installApp.style.display = 'none';
        deferredPrompt = null;
        showToast('🎉 GlamStickyNote installed successfully!', 'success');
    });

    // Offline/Online Status Indicator
    const offlineIndicator = document.getElementById('offlineIndicator');

    window.addEventListener('offline', () => {
        if (offlineIndicator) {
            offlineIndicator.classList.add('visible');
        }
        showToast('📡 You are offline. Changes will sync when reconnected.', 'warning', null, 3000);
    });

    window.addEventListener('online', () => {
        if (offlineIndicator) {
            offlineIndicator.classList.remove('visible');
        }
        showToast('✅ Back online! Data syncing...', 'success', null, 2000);
    });

    // Check initial status
    if (!navigator.onLine && offlineIndicator) {
        offlineIndicator.classList.add('visible');
    }

}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
