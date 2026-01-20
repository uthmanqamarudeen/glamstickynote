# ✨ GlamStickyNote

> **Premium digital sticky notes for your daily task management.**

GlamStickyNote is a beautiful, glassmorphic kanban-style task manager designed to make organizing your day feel premium and satisfying. Built with modern web technologies, it features a rich dark mode UI, smooth animations, and a focus on aesthetics.

![App Icon](./assets/icon-512.png)

## 🚀 Features

### Core Experience
*   **Kanban Board Workflow:** Organize tasks into "To Do", "In Progress", and "Done".
*   **Drag & Drop:** Smoothly drag notes between columns to update their status.
*   **Premium UI:** Deep navy background, glassmorphic sidebars, and pastel note colors (`#0f172a` theme).
*   **Local Storage:** Your data is saved automatically in your browser—no login required.

### Smart Organization
*   **Filtering:** View notes by "Today", "Upcoming", or "All Notes".
*   **Tags System:** Add tags to notes and filter by clicking them in the sidebar.
*   **Calendar Integration:** Interactive mini-calendar to filter notes by specific dates.
*   **Search:** Real-time search by title, description, or tags.

### Productivity Tools
*   **⚡ Quick Add:** Press `/` to focus the quick-add bar and hit Enter to create tasks instantly.
*   **⌨️ Keyboard Shortcuts:** Full keyboard control (Press `?` to see the cheat sheet).
*   **🚨 Overdue Alerts:** Notes past their due date pulse with a red warning border.
*   **↩️ Undo Delete:** Accidentally deleted a note? Restore it instantly with the toast notification.
*   **Data Management:** Export your data to JSON backup or import from a file.

### 📱 Mobile & PWA
*   **Fully Responsive:** Works beautifully on desktop, tablet, and mobile.
*   **Installable:** Install as a native app (PWA) on your device for an immersive experience.
*   **Mobile Optimized:** Touch-friendly controls, sidebar overlay, and specific mobile layouts.

## 🛠️ Tech Stack
*   **HTML5** (Semantic structure)
*   **CSS3** (Variables, Flexbox, Grid, Glassmorphism, Animations)
*   **JavaScript (ES6+)** (DOM manipulation, LocalStorage, Drag & Drop API)
*   **No Frameworks:** Pure, lightweight Vanilla JS for maximum performance.

## 🚦 How to Run

Since this project uses PWA features (manifest.json, service workers), it must be served over `http://` or `https://`, not opened directly as a file.

### Option 1: VS Code Live Server (Recommended)
1.  Open the project in VS Code.
2.  Install the **Live Server** extension.
3.  Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Node.js http-server
Run this in your terminal:
```bash
npx http-server .
```
Then open `http://localhost:8080` in your browser.

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Ctrl + N` | Create New Note |
| `/` | Focus Quick Add Bar |
| `A` | View All Notes |
| `T` | View Today's Notes |
| `U` | View Upcoming Notes |
| `?` | Show Shortcuts Modal |
| `Esc` | Close Modals / Clear Filters |

## 👥 Credits
Built with ❤️ by **GlamStickyNote Team**.
