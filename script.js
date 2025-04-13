// Import Three.js
import * as THREE from 'three';

// --- Three.js Setup (Subtle Background) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
// Make background even more subtle
renderer.setClearColor(0x000000, 0); // Fully transparent
document.getElementById('three-container').appendChild(renderer.domElement);

// Simple geometry (e.g., a slowly rotating Torus)
const geometry = new THREE.TorusGeometry( 2, 0.1, 16, 100 );
const material = new THREE.MeshBasicMaterial( { color: 0xaaaaaa, wireframe: true, transparent: true, opacity: 0.5 } ); // Subtle wireframe
const torus = new THREE.Mesh( geometry, material );
scene.add( torus );

camera.position.z = 5;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    torus.rotation.x += 0.001; // Very slow rotation
    torus.rotation.y += 0.0005;
    renderer.render(scene, camera);
}
animate();

// --- Attendance App Logic ---

const nameInput = document.getElementById('nameInput');
const addButton = document.getElementById('addButton');
const attendanceList = document.getElementById('attendanceList');
const emptyListMessage = document.getElementById('emptyListMessage');
const totalCountEl = document.getElementById('totalCount');
const presentCountEl = document.getElementById('presentCount');
const absentCountEl = document.getElementById('absentCount');
const pendingCountEl = document.getElementById('pendingCount');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const bulkDeleteButton = document.getElementById('bulkDeleteButton');
const selectedCountEl = document.getElementById('selectedCount');

// Load data - selection state is transient, not saved
let attendees = (JSON.parse(localStorage.getItem('attendanceData')) || []).map(att => ({
    ...att,
    selected: false // Initialize selection state on load
}));

// --- Rendering ---
function renderList() {
    const fragment = document.createDocumentFragment();
    let presentCount = 0;
    let absentCount = 0;
    let pendingCount = 0;
    let selectedCount = 0;
    let allSelected = attendees.length > 0; // Assume all selected if list not empty

    // Sort attendees alphabetically (optional)
    attendees.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    attendees.forEach(attendee => {
        const li = createListItem(attendee);
        fragment.appendChild(li);

        // Calculate counts
        if (attendee.status === 'present') presentCount++;
        else if (attendee.status === 'absent') absentCount++;
        else pendingCount++;

        if(attendee.selected) selectedCount++;
        else allSelected = false; // If even one is not selected, uncheck "select all"
    });

    // Clear list and append new items
    attendanceList.innerHTML = '';
    attendanceList.appendChild(fragment);

    // Update summary counts
    totalCountEl.textContent = attendees.length;
    presentCountEl.textContent = presentCount;
    absentCountEl.textContent = absentCount;
    pendingCountEl.textContent = pendingCount;

    // Update bulk action states
    selectedCountEl.textContent = selectedCount;
    bulkDeleteButton.disabled = selectedCount === 0;
    selectAllCheckbox.checked = allSelected;
    selectAllCheckbox.indeterminate = selectedCount > 0 && !allSelected; // Indeterminate state

    // Show/hide empty list message
    emptyListMessage.style.display = attendees.length === 0 ? 'block' : 'none';

    saveData(); // Save status changes (but not selection)
}

function createListItem(attendee) {
    const li = document.createElement('li');
    li.setAttribute('data-id', attendee.id);
    li.classList.add(attendee.status);
    if (attendee.selected) {
        li.classList.add('selected');
    }

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('item-checkbox');
    checkbox.checked = attendee.selected;
    checkbox.setAttribute('aria-label', `تحديد ${attendee.name}`);
    checkbox.addEventListener('change', () => toggleSelectAttendee(attendee.id));
    li.appendChild(checkbox);

    // Name
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('attendee-name');
    nameSpan.textContent = attendee.name;
    li.appendChild(nameSpan);

    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('actions');

    // Action Buttons
    const presentBtn = createActionButton('✓', 'present-btn', `تسجيل ${attendee.name} كحاضر`, () => markAttendance(attendee.id, 'present'));
    const absentBtn = createActionButton('✕', 'absent-btn', `تسجيل ${attendee.name} كغائب`, () => markAttendance(attendee.id, 'absent'));
    const deleteBtn = createActionButton('🗑️', 'delete-btn', `حذف ${attendee.name}`, () => confirmDeleteSingle(attendee.id, attendee.name));

    actionsDiv.appendChild(presentBtn);
    actionsDiv.appendChild(absentBtn);
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(actionsDiv);

    return li;
}

// Helper for creating action buttons
function createActionButton(text, className, title, onClick) {
    const button = document.createElement('button');
    button.innerHTML = text; // Use innerHTML to render icons like 🗑️
    button.classList.add('action-btn', className);
    button.title = title;
    button.setAttribute('aria-label', title);
    button.addEventListener('click', onClick);
    return button;
}

// --- Event Handlers & Actions ---

function addAttendee() {
    const name = nameInput.value.trim();
    if (name === '') {
        alert('الرجاء إدخال اسم.');
        nameInput.focus();
        return;
    }
    if (attendees.some(att => att.name.toLowerCase() === name.toLowerCase())) {
         alert(`الاسم "${name}" موجود بالفعل.`);
         nameInput.select();
         return;
    }

    const newAttendee = {
        id: Date.now(),
        name: name,
        status: 'pending',
        selected: false // New items are not selected by default
    };
    attendees.push(newAttendee);
    nameInput.value = '';
    nameInput.focus();
    renderList();
}

function markAttendance(id, newStatus) {
    attendees = attendees.map(attendee =>
        attendee.id === id ? { ...attendee, status: newStatus } : attendee
    );
    renderList();
}

function toggleSelectAttendee(id) {
    attendees = attendees.map(attendee =>
        attendee.id === id ? { ...attendee, selected: !attendee.selected } : attendee
    );
    // Don't save selection state, just re-render to update UI
    renderList();
}

function toggleSelectAll() {
    const isChecked = selectAllCheckbox.checked;
    attendees = attendees.map(attendee => ({ ...attendee, selected: isChecked }));
    renderList();
}

function confirmDeleteSingle(id, name) {
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
        deleteAttendees([id]); // Use the same function as bulk delete
    }
}

function confirmDeleteBulk() {
    const selectedIds = attendees.filter(att => att.selected).map(att => att.id);
    if (selectedIds.length === 0) return; // Should be disabled, but double check

    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} عنصر المحدد؟`)) {
        deleteAttendees(selectedIds);
    }
}

function deleteAttendees(idsToDelete) {
    attendees = attendees.filter(attendee => !idsToDelete.includes(attendee.id));
    // Ensure selectAll is unchecked if list becomes empty or selection changes
    selectAllCheckbox.checked = false;
    renderList();
}

// --- Data Persistence ---
function saveData() {
    // Save only id, name, and status - not the transient 'selected' state
    const dataToSave = attendees.map(({ id, name, status }) => ({ id, name, status }));
    localStorage.setItem('attendanceData', JSON.stringify(dataToSave));
}

// --- Initial Setup & Event Listeners ---
addButton.addEventListener('click', addAttendee);
nameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addAttendee();
    }
});
selectAllCheckbox.addEventListener('change', toggleSelectAll);
bulkDeleteButton.addEventListener('click', confirmDeleteBulk);

// Initial render on load
renderList();
