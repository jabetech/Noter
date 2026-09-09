/* =========================================
   SMART NOTES APP
   ========================================= */


/* ---------- STORAGE ---------- */

const STORAGE_KEY = "smartNotesData";
const THEME_KEY = "smartNotesTheme";


/* ---------- STATE ---------- */

let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

let currentSection = "all";
let currentCategory = "All";
let currentSort = "newest";
let currentViewId = null;


/* ---------- DOM ---------- */

const notesGrid = document.getElementById("notesGrid");
const searchInput = document.getElementById("searchInput");

const noteModal = document.getElementById("noteModal");
const viewModal = document.getElementById("viewModal");

const noteForm = document.getElementById("noteForm");

const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const noteCategory = document.getElementById("noteCategory");
const noteColor = document.getElementById("noteColor");
const editId = document.getElementById("editId");

const modalTitle = document.getElementById("modalTitle");


/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {

    loadTheme();
    renderNotes();
    updateCounts();

});


/* ---------- SAVE DATA ---------- */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notes)
    );

}


/* ---------- CREATE / EDIT NOTE ---------- */

function openNoteModal(id = null) {

    noteForm.reset();

    editId.value = "";
    noteColor.value = "yellow";

    document
        .querySelectorAll(".color-option")
        .forEach(btn => btn.classList.remove("selected"));

    document
        .querySelector('.color-option[data-color="yellow"]')
        .classList.add("selected");


    if (id) {

        const note = notes.find(n => n.id === id);

        if (!note) return;

        modalTitle.textContent = "Edit Note";

        editId.value = note.id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        noteCategory.value = note.category;
        noteColor.value = note.color;

        document
            .querySelectorAll(".color-option")
            .forEach(btn => {

                btn.classList.toggle(
                    "selected",
                    btn.dataset.color === note.color
                );

            });

    } else {

        modalTitle.textContent = "Create New Note";

    }

    noteModal.classList.add("show");

    setTimeout(() => noteTitle.focus(), 100);

}


function closeNoteModal() {

    noteModal.classList.remove("show");

}


function saveNote(event) {

    event.preventDefault();

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    const category = noteCategory.value;
    const color = noteColor.value;

    if (!title || !content) {

        showToast("Please fill in all fields");

        return;

    }


    const existingId = editId.value;


    if (existingId) {

        const note = notes.find(
            n => n.id === existingId
        );

        if (note) {

            note.title = title;
            note.content = content;
            note.category = category;
            note.color = color;
            note.updatedAt = Date.now();

        }

        showToast("Note updated successfully ✨");

    } else {

        const newNote = {

            id: Date.now().toString(),

            title: title,

            content: content,

            category: category,

            color: color,

            pinned: false,

            favorite: false,

            deleted: false,

            createdAt: Date.now(),

            updatedAt: Date.now()

        };

        notes.unshift(newNote);

        showToast("Note created successfully 📝");

    }


    saveData();

    closeNoteModal();

    renderNotes();

    updateCounts();

}


/* ---------- VIEW NOTE ---------- */

function openViewModal(id) {

    const note = notes.find(n => n.id === id);

    if (!note) return;

    currentViewId = id;

    document.getElementById("viewTitle").textContent =
        note.title;

    document.getElementById("viewContent").textContent =
        note.content;

    document.getElementById("viewCategory").textContent =
        note.category;

    document.getElementById("viewDate").textContent =
        "Last updated " + formatDate(note.updatedAt);

    viewModal.classList.add("show");

}


function closeViewModal() {

    viewModal.classList.remove("show");

    currentViewId = null;

}


/* ---------- EDIT FROM VIEW ---------- */

function editCurrentNote() {

    if (!currentViewId) return;

    const id = currentViewId;

    closeViewModal();

    setTimeout(() => {

        openNoteModal(id);

    }, 150);

}


/* ---------- DELETE ---------- */

function deleteCurrentNote() {

    if (!currentViewId) return;

    moveToTrash(currentViewId);

    closeViewModal();

}


function moveToTrash(id) {

    const note = notes.find(n => n.id === id);

    if (!note) return;

    if (note.deleted) {

        notes = notes.filter(n => n.id !== id);

        showToast("Note permanently deleted");

    } else {

        note.deleted = true;

        note.pinned = false;

        note.favorite = false;

        showToast("Note moved to trash 🗑️");

    }

    saveData();

    renderNotes();

    updateCounts();

}


/* ---------- RESTORE ---------- */

function restoreNote(id) {

    const note = notes.find(n => n.id === id);

    if (!note) return;

    note.deleted = false;

    note.updatedAt = Date.now();

    saveData();

    renderNotes();

    updateCounts();

    showToast("Note restored ♻️");

}


/* ---------- PIN ---------- */

function togglePin(id) {

    const note = notes.find(n => n.id === id);

    if (!note) return;

    note.pinned = !note.pinned;

    note.updatedAt = Date.now();

    saveData();

    renderNotes();

    updateCounts();

    showToast(
        note.pinned
            ? "Note pinned 📌"
            : "Note unpinned"
    );

}


/* ---------- FAVORITE ---------- */

function toggleFavorite(id) {

    const note = notes.find(n => n.id === id);

    if (!note) return;

    note.favorite = !note.favorite;

    note.updatedAt = Date.now();

    saveData();

    renderNotes();

    updateCounts();

    showToast(
        note.favorite
            ? "Added to favorites ⭐"
            : "Removed from favorites"
    );

}


/* ---------- RENDER ---------- */

function renderNotes() {

    let filtered = [...notes];

    const search = searchInput.value
        .trim()
        .toLowerCase();


    /* Section */

    if (currentSection === "all") {

        filtered = filtered.filter(
            note => !note.deleted
        );

    }

    if (currentSection === "pinned") {

        filtered = filtered.filter(
            note => note.pinned && !note.deleted
        );

    }

    if (currentSection === "favorites") {

        filtered = filtered.filter(
            note => note.favorite && !note.deleted
        );

    }

    if (currentSection === "trash") {

        filtered = filtered.filter(
            note => note.deleted
        );

    }


    /* Category */

    if (
        currentCategory !== "All" &&
        currentSection !== "trash"
    ) {

        filtered = filtered.filter(
            note => note.category === currentCategory
        );

    }


    /* Search */

    if (search) {

        filtered = filtered.filter(note =>

            note.title
                .toLowerCase()
                .includes(search)

            ||

            note.content
                .toLowerCase()
                .includes(search)

            ||

            note.category
                .toLowerCase()
                .includes(search)

        );

    }


    /* Sort */

    filtered.sort((a, b) => {

        if (currentSort === "newest") {

            return b.updatedAt - a.updatedAt;

        }

        if (currentSort === "oldest") {

            return a.updatedAt - b.updatedAt;

        }

        if (currentSort === "az") {

            return a.title.localeCompare(b.title);

        }

    });


    /* Render */

    if (filtered.length === 0) {

        notesGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ${currentSection === "trash" ? "🗑️" : "📝"}
                </div>

                <h3>
                    ${
                        currentSection === "trash"
                        ? "Trash is empty"
                        : "No notes found"
                    }
                </h3>

                <p>
                    ${
                        currentSection === "trash"
                        ? "Deleted notes will appear here."
                        : "Create your first note to get started."
                    }
                </p>

            </div>

        `;

        return;

    }


    notesGrid.innerHTML = filtered
        .map(note => createNoteHTML(note))
        .join("");

}


/* ---------- NOTE HTML ---------- */

function createNoteHTML(note) {

    const safeTitle = escapeHTML(note.title);

    const safeContent = escapeHTML(note.content);

    const safeCategory = escapeHTML(note.category);


    if (note.deleted) {

        return `

            <article class="note-card ${note.color}">

                <div class="note-top">

                    <span class="category-badge">
                        ${safeCategory}
                    </span>

                    <div class="note-actions">

                        <button
                            class="note-action"
                            onclick="restoreNote('${note.id}')"
                            title="Restore"
                        >
                            ♻️
                        </button>

                        <button
                            class="note-action"
                            onclick="permanentDelete('${note.id}')"
                            title="Delete permanently"
                        >
                            ❌
                        </button>

                    </div>

                </div>

                <h3 class="note-title">
                    ${safeTitle}
                </h3>

                <p class="note-preview">
                    ${safeContent}
                </p>

                <div class="note-footer">

                    <span>
                        ${formatDate(note.updatedAt)}
                    </span>

                    <span>In Trash</span>

                </div>

            </article>

        `;

    }


    return `

        <article
            class="note-card ${note.color}"
            onclick="openViewModal('${note.id}')"
        >

            <div class="note-top">

                <span class="category-badge">
                    ${safeCategory}
                </span>

                <div
                    class="note-actions"
                    onclick="event.stopPropagation()"
                >

                    <button
                        class="note-action"
                        onclick="togglePin('${note.id}')"
                        title="Pin"
                    >
                        ${note.pinned ? "📌" : "📍"}
                    </button>

                    <button
                        class="note-action"
                        onclick="toggleFavorite('${note.id}')"
                        title="Favorite"
                    >
                        ${note.favorite ? "⭐" : "☆"}
                    </button>

                    <button
                        class="note-action"
                        onclick="openNoteModal('${note.id}')"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        class="note-action"
                        onclick="moveToTrash('${note.id}')"
                        title="Delete"
                    >
                        🗑️
                    </button>

                </div>

            </div>

            <h3 class="note-title">
                ${safeTitle}
            </h3>

            <p class="note-preview">
                ${safeContent}
            </p>

            <div class="note-footer">

                <span>
                    ${formatDate(note.updatedAt)}
                </span>

                <span class="pin-mark">
                    ${note.pinned ? "📌" : ""}
                    ${note.favorite ? "⭐" : ""}
                </span>

            </div>

        </article>

    `;

}


/* ---------- PERMANENT DELETE ---------- */

function permanentDelete(id) {

    const confirmDelete =
        confirm(
            "Permanently delete this note?"
        );

    if (!confirmDelete) return;

    notes = notes.filter(
        note => note.id !== id
    );

    saveData();

    renderNotes();

    updateCounts();

    showToast("Note permanently deleted");

}


/* ---------- SECTION ---------- */

function changeSection(section, element) {

    currentSection = section;

    document
        .querySelectorAll(".nav-item")
        .forEach(item => item.classList.remove("active"));

    element.classList.add("active");


    const titles = {

        all: "All Notes",

        pinned: "Pinned Notes",

        favorites: "Favorite Notes",

        trash: "Trash"

    };

    document.getElementById("pageTitle").textContent =
        titles[section];


    const subtitles = {

        all: "Your latest thoughts and ideas",

        pinned: "Important notes you've pinned",

        favorites: "Notes you've marked as favorites",

        trash: "Deleted notes"

    };

    document.getElementById("noteSubtitle").textContent =
        subtitles[section];


    document.getElementById("sectionTitle").textContent =
        section === "trash"
            ? "Deleted Notes"
            : "Recent Notes";


    renderNotes();

}


/* ---------- CATEGORY ---------- */

function setCategory(category, element) {

    currentCategory = category;

    document
        .querySelectorAll(".filter")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    element.classList.add("active");

    renderNotes();

}


/* ---------- SORT ---------- */

function toggleSort() {

    if (currentSort === "newest") {

        currentSort = "oldest";

        showToast("Sorted by oldest");

    } else if (currentSort === "oldest") {

        currentSort = "az";

        showToast("Sorted A-Z");

    } else {

        currentSort = "newest";

        showToast("Sorted by newest");

    }

    renderNotes();

}


/* ---------- COLOR ---------- */

function selectColor(button) {

    document
        .querySelectorAll(".color-option")
        .forEach(btn =>
            btn.classList.remove("selected")
        );

    button.classList.add("selected");

    noteColor.value =
        button.dataset.color;

}


/* ---------- COUNTS ---------- */

function updateCounts() {

    const activeNotes =
        notes.filter(n => !n.deleted);

    const pinned =
        activeNotes.filter(n => n.pinned);

    const favorites =
        activeNotes.filter(n => n.favorite);

    const trash =
        notes.filter(n => n.deleted);


    document.getElementById("allCount").textContent =
        activeNotes.length;

    document.getElementById("pinnedCount").textContent =
        pinned.length;

    document.getElementById("favoriteCount").textContent =
        favorites.length;

    document.getElementById("trashCount").textContent =
        trash.length;

}


/* ---------- DATE ---------- */

function formatDate(timestamp) {

    const date =
        new Date(timestamp);

    const now =
        new Date();

    const diff =
        now - date;

    const minutes =
        Math.floor(diff / 60000);

    if (minutes < 1) {

        return "Just now";

    }

    if (minutes < 60) {

        return `${minutes}m ago`;

    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {

        return `${hours}h ago`;

    }

    const days =
        Math.floor(hours / 24);

    if (days < 7) {

        return `${days}d ago`;

    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ---------- THEME ---------- */

function toggleTheme() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        THEME_KEY,
        dark ? "dark" : "light"
    );

    updateThemeButton();

}


function loadTheme() {

    const theme =
        localStorage.getItem(THEME_KEY);

    if (theme === "dark") {

        document.body.classList.add("dark");

    }

    updateThemeButton();

}


function updateThemeButton() {

    const dark =
        document.body.classList.contains("dark");

    document.getElementById("themeIcon").textContent =
        dark ? "☀️" : "🌙";

    document.getElementById("themeText").textContent =
        dark ? "Light Mode" : "Dark Mode";

}


/* ---------- TOAST ---------- */

let toastTimer;

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2200);

}


/* ---------- ESCAPE HTML ---------- */

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ---------- KEYBOARD SHORTCUT ---------- */

document.addEventListener("keydown", event => {

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        searchInput.focus();

    }


    if (event.key === "Escape") {

        closeNoteModal();

        closeViewModal();

    }

});


/* ---------- CLOSE MODAL WHEN CLICK OUTSIDE ---------- */

noteModal.addEventListener("click", event => {

    if (event.target === noteModal) {

        closeNoteModal();

    }

});


viewModal.addEventListener("click", event => {

    if (event.target === viewModal) {

        closeViewModal();

    }

});