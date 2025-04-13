// استيراد Three.js
import * as THREE from 'three';

// --- إعداد Three.js (نفس الكود السابق، يمكن تعديل المجسم أو الحركة إذا أردت) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('three-container').appendChild(renderer.domElement);

// استخدام شكل أكثر بساطة وأقل استهلاكاً للموارد (TorusKnot كمثال)
const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
const material = new THREE.MeshNormalMaterial({ flatShading: false }); // استخدام Shading ناعم
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

camera.position.z = 5;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.002; // حركة أبطأ
    mesh.rotation.y += 0.003;
    renderer.render(scene, camera);
}
animate();

// --- منطق تطبيق الحضور والغياب ---

const nameInput = document.getElementById('nameInput');
const addButton = document.getElementById('addButton');
const attendanceList = document.getElementById('attendanceList');
const totalCountEl = document.getElementById('totalCount');
const presentCountEl = document.getElementById('presentCount');
const absentCountEl = document.getElementById('absentCount');
const pendingCountEl = document.getElementById('pendingCount'); // إضافة عداد قيد الانتظار

// تحميل البيانات من LocalStorage
let attendees = JSON.parse(localStorage.getItem('attendanceData')) || [];

// وظيفة لتحديث عرض القائمة والملخص (محسنة)
function renderList() {
    // استخدام DocumentFragment لتحسين الأداء عند إضافة عناصر كثيرة
    const fragment = document.createDocumentFragment();
    let presentCount = 0;
    let absentCount = 0;
    let pendingCount = 0;

    // فرز الأسماء أبجدياً (اختياري)
    attendees.sort((a, b) => a.name.localeCompare(b.name, 'ar'));


    attendees.forEach(attendee => {
        const li = document.createElement('li');
        li.setAttribute('data-id', attendee.id);
        li.classList.add(attendee.status); // 'present', 'absent', or 'pending'

        const nameSpan = document.createElement('span');
        nameSpan.textContent = attendee.name;

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('actions');

        // أزرار الحضور والغياب
        const presentButton = createActionButton('✓', 'present-btn', `تسجيل حضور لـ ${attendee.name}`, () => markAttendance(attendee.id, 'present'));
        const absentButton = createActionButton('✕', 'absent-btn', `تسجيل غياب لـ ${attendee.name}`, () => markAttendance(attendee.id, 'absent'));

        // *** زر الحذف الجديد ***
        const deleteButton = createActionButton('🗑️', 'delete-btn', `حذف ${attendee.name}`, () => confirmDelete(attendee.id, attendee.name)); // استخدام رمز سلة مهملات أو '×'

        actionsDiv.appendChild(presentButton);
        actionsDiv.appendChild(absentButton);
        actionsDiv.appendChild(deleteButton); // إضافة زر الحذف

        li.appendChild(nameSpan);
        li.appendChild(actionsDiv);
        fragment.appendChild(li); // إضافة العنصر إلى الـ fragment

        // حساب الملخص
        if (attendee.status === 'present') presentCount++;
        else if (attendee.status === 'absent') absentCount++;
        else pendingCount++; // حساب الحالات المعلقة
    });

    // مسح القائمة الحالية وإضافة العناصر الجديدة دفعة واحدة
    attendanceList.innerHTML = '';
    attendanceList.appendChild(fragment);


    // تحديث أرقام الملخص
    totalCountEl.textContent = attendees.length;
    presentCountEl.textContent = presentCount;
    absentCountEl.textContent = absentCount;
    pendingCountEl.textContent = pendingCount; // تحديث عداد قيد الانتظار

    saveData(); // حفظ الحالة بعد كل تحديث
}

// وظيفة مساعدة لإنشاء أزرار الإجراءات
function createActionButton(text, className, title, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('action-btn', className);
    button.title = title; // إضافة تلميح مفيد
    button.addEventListener('click', onClick);
    return button;
}


// وظيفة لإضافة اسم جديد
function addAttendee() {
    const name = nameInput.value.trim();
    if (name === '') {
        // تنبيه بسيط أو يمكن تحسينه لاحقاً (مثل هز الحقل)
        nameInput.style.borderColor = 'red';
        setTimeout(() => { nameInput.style.borderColor = 'var(--border-color)'; }, 1500);
        return;
    }

    // التحقق من عدم وجود الاسم مسبقاً (اختياري)
    if (attendees.some(att => att.name.toLowerCase() === name.toLowerCase())) {
         alert(`الاسم "${name}" موجود بالفعل في القائمة.`);
         return;
    }


    const newAttendee = {
        id: Date.now(),
        name: name,
        status: 'pending'
    };

    attendees.push(newAttendee);
    nameInput.value = '';
    nameInput.focus(); // إعادة التركيز على حقل الإدخال
    renderList();
}

// وظيفة لتحديد حالة الحضور أو الغياب
function markAttendance(id, newStatus) {
    attendees = attendees.map(attendee =>
        attendee.id === id ? { ...attendee, status: newStatus } : attendee
    );
    renderList();
}

// *** وظيفة لتأكيد الحذف ***
function confirmDelete(id, name) {
    // يمكنك استخدام نافذة تأكيد مخصصة وأجمل لاحقًا، الآن نستخدم confirm البسيطة
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
        deleteAttendee(id);
    }
}

// *** وظيفة لحذف الاسم ***
function deleteAttendee(id) {
    // إضافة تأثير بصري قبل الحذف الفعلي
    const itemToDelete = attendanceList.querySelector(`li[data-id="${id}"]`);
    if (itemToDelete) {
        itemToDelete.classList.add('removing'); // إضافة فئة التلاشي
        // الانتظار لانتهاء التأثير ثم الحذف من البيانات وإعادة الرسم
        setTimeout(() => {
            attendees = attendees.filter(attendee => attendee.id !== id);
            renderList();
        }, 400); // مدة التأثير في CSS
    } else {
        // إذا لم يتم العثور على العنصر (احتياطي)
        attendees = attendees.filter(attendee => attendee.id !== id);
        renderList();
    }
}

// وظيفة لحفظ البيانات
function saveData() {
    localStorage.setItem('attendanceData', JSON.stringify(attendees));
}

// ربط الأحداث
addButton.addEventListener('click', addAttendee);
nameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addAttendee();
    }
});

// عرض القائمة عند التحميل
renderList();
