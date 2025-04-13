// استيراد Three.js من CDN المحدد في importmap
import * as THREE from 'three';

// --- إعداد Three.js للخلفية ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // alpha: true للخلفية الشفافة

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('three-container').appendChild(renderer.domElement);

// إنشاء شكل هندسي (مثل Icosphere ليكون شكله أجمل من المكعب)
const geometry = new THREE.IcosahedronGeometry(1.5, 0); // الحجم والتفاصيل
// مادة تعكس الضوء بشكل طبيعي وتتغير ألوانها
const material = new THREE.MeshNormalMaterial({ flatShading: true });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// تحديد موقع الكاميرا
camera.position.z = 5;

// التعامل مع تغيير حجم النافذة
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// وظيفة التحريك
function animate() {
    requestAnimationFrame(animate);

    // دوران المجسم
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.007;

    renderer.render(scene, camera);
}
animate(); // بدء التحريك

// --- منطق تطبيق الحضور والغياب ---

const nameInput = document.getElementById('nameInput');
const addButton = document.getElementById('addButton');
const attendanceList = document.getElementById('attendanceList');
const totalCountEl = document.getElementById('totalCount');
const presentCountEl = document.getElementById('presentCount');
const absentCountEl = document.getElementById('absentCount');

// تحميل البيانات من LocalStorage إن وجدت
let attendees = JSON.parse(localStorage.getItem('attendanceData')) || [];

// وظيفة لتحديث عرض القائمة والملخص
function renderList() {
    attendanceList.innerHTML = ''; // مسح القائمة الحالية
    let presentCount = 0;
    let absentCount = 0;

    attendees.forEach(attendee => {
        const li = document.createElement('li');
        li.setAttribute('data-id', attendee.id);
        li.classList.add(attendee.status); // 'present', 'absent', or 'pending'

        const nameSpan = document.createElement('span');
        nameSpan.textContent = attendee.name;

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('actions');

        const presentButton = document.createElement('button');
        presentButton.textContent = 'حاضر';
        presentButton.classList.add('present-btn');
        presentButton.addEventListener('click', () => markAttendance(attendee.id, 'present'));

        const absentButton = document.createElement('button');
        absentButton.textContent = 'غائب';
        absentButton.classList.add('absent-btn');
        absentButton.addEventListener('click', () => markAttendance(attendee.id, 'absent'));

        actionsDiv.appendChild(presentButton);
        actionsDiv.appendChild(absentButton);

        li.appendChild(nameSpan);
        li.appendChild(actionsDiv);

        attendanceList.appendChild(li);

        // حساب الملخص
        if (attendee.status === 'present') {
            presentCount++;
        } else if (attendee.status === 'absent') {
            absentCount++;
        }
    });

    // تحديث أرقام الملخص
    totalCountEl.textContent = attendees.length;
    presentCountEl.textContent = presentCount;
    absentCountEl.textContent = absentCount;

    // حفظ الحالة الحالية في LocalStorage
    saveData();
}

// وظيفة لإضافة اسم جديد
function addAttendee() {
    const name = nameInput.value.trim();
    if (name === '') {
        alert('الرجاء إدخال اسم!');
        return;
    }

    const newAttendee = {
        id: Date.now(), // استخدام timestamp كمعرف فريد بسيط
        name: name,
        status: 'pending' // الحالة الأولية: لم يتم التحديد
    };

    attendees.push(newAttendee);
    nameInput.value = ''; // مسح حقل الإدخال
    renderList(); // إعادة رسم القائمة
}

// وظيفة لتحديد حالة الحضور أو الغياب
function markAttendance(id, newStatus) {
    attendees = attendees.map(attendee => {
        if (attendee.id === id) {
            return { ...attendee, status: newStatus };
        }
        return attendee;
    });
    renderList(); // إعادة رسم القائمة لتعكس التغيير
}

// وظيفة لحفظ البيانات في LocalStorage
function saveData() {
    localStorage.setItem('attendanceData', JSON.stringify(attendees));
}

// ربط الأحداث
addButton.addEventListener('click', addAttendee);
// السماح بالإضافة عند الضغط على Enter في حقل الإدخال
nameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addAttendee();
    }
});

// عرض القائمة عند تحميل الصفحة لأول مرة بالبيانات المحفوظة (إن وجدت)
renderList();
