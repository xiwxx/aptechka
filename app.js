// ===== КУРСОР =====
const dot = document.getElementById('cursor-dot');
const circle = document.getElementById('cursor-circle');
let mouseX = 0, mouseY = 0;
let circleX = 0, circleY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px';
});

function animateCircle() {
  circleX += (mouseX - circleX) * 0.15;
  circleY += (mouseY - circleY) * 0.15;
  circle.style.left = circleX + 'px'; circle.style.top = circleY + 'px';
  requestAnimationFrame(animateCircle);
}
animateCircle();

document.querySelectorAll('button, a, .card, .med-card, input, select').forEach(el => {
  el.addEventListener('mouseenter', () => circle.classList.add('hover'));
  el.addEventListener('mouseleave', () => circle.classList.remove('hover'));
});

// ===== ТЕМА =====
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeBtn.innerText = isDark ? '🌙 Тема' : '☀️ Тема';
});

// ===== ВСПОМОГАТЕЛЬНОЕ =====
function val(id) { return document.getElementById(id).value; }
function setVal(id, v) { document.getElementById(id).value = v; }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// ===== АВТОРИЗАЦИЯ =====
function getUsers() {
  try { return JSON.parse(localStorage.getItem('capsula_users') || '[]'); }
  catch { return []; }
}
function saveUsers(list) { localStorage.setItem('capsula_users', JSON.stringify(list)); }
function getSession() { return localStorage.getItem('capsula_session'); }

async function hashPassword(str) {
  const data = new TextEncoder().encode(str + '::capsula-salt');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function openAuth() { document.getElementById('auth-login').classList.add('active'); }
function closeAuth() {
  document.getElementById('auth-login').classList.remove('active');
  document.getElementById('auth-register').classList.remove('active');
}
function openLogin() {
  document.getElementById('auth-register').classList.remove('active');
  document.getElementById('auth-login').classList.add('active');
}
function openRegister() {
  document.getElementById('auth-login').classList.remove('active');
  document.getElementById('auth-register').classList.add('active');
}

async function register() {
  const name = val('reg-name').trim();
  const email = val('reg-email').trim().toLowerCase();
  const pwd = val('reg-password');
  const pwd2 = val('reg-password2');
  const err = document.getElementById('reg-error');
  err.innerText = '';
  if (!name || !email || !pwd) { err.innerText = 'Заполните все поля.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.innerText = 'Некорректный email.'; return; }
  if (pwd.length < 4) { err.innerText = 'Пароль должен быть минимум 4 символа.'; return; }
  if (pwd !== pwd2) { err.innerText = 'Пароли не совпадают.'; return; }
  const users = getUsers();
  if (users.some(u => u.email === email)) { err.innerText = 'Этот email уже зарегистрирован.'; return; }
  const hash = await hashPassword(pwd);
  users.push({ name, email, hash });
  saveUsers(users);
  localStorage.setItem('capsula_session', email);
  closeAuth();
  enterApp();
}

async function login() {
  const email = val('login-email').trim().toLowerCase();
  const pwd = val('login-password');
  const err = document.getElementById('login-error');
  err.innerText = '';
  if (!email || !pwd) { err.innerText = 'Введите email и пароль.'; return; }
  const users = getUsers();
  const user = users.find(u => u.email === email);
  const hash = await hashPassword(pwd);
  if (!user || user.hash !== hash) { err.innerText = 'Неверный email или пароль.'; return; }
  localStorage.setItem('capsula_session', email);
  closeAuth();
  enterApp();
}

function logout() {
  localStorage.removeItem('capsula_session');
  closeApp();
}

function renderProfile() {
  const email = getSession();
  const user = getUsers().find(u => u.email === email);
  if (!user) return;
  document.getElementById('profile-name').innerText = user.name;
  document.getElementById('profile-email').innerText = user.email;
}

// ===== ЛЕКАРСТВА (localStorage) =====
function getMedicines() {
  const email = getSession();
  if (!email) return [];
  try { return JSON.parse(localStorage.getItem('capsula_medicines_' + email) || '[]'); }
  catch { return []; }
}
function saveMedicines(list) {
  const email = getSession();
  if (!email) return;
  localStorage.setItem('capsula_medicines_' + email, JSON.stringify(list));
}

function getStatus(expiry) {
  if (!expiry) return 'ok';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = (new Date(expiry) - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'soon';
  return 'ok';
}

const STATUS_LABELS = { ok: 'В норме', soon: 'Истекает', expired: 'Просрочено' };
let currentFilter = 'all';

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.filter === f));
  renderMedicines();
}

function renderMedicines() {
  const grid = document.getElementById('medicines-grid');
  const q = (val('search-input') || '').toLowerCase().trim();
  let list = getMedicines().filter(m => {
    const matches = !q || (m.name || '').toLowerCase().includes(q) || (m.purpose || '').toLowerCase().includes(q);
    return matches && (currentFilter === 'all' || getStatus(m.expiry) === currentFilter);
  });

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">
      <div class="empty-icon">💊</div>
      <h3>Ничего не найдено</h3>
      <p>${getMedicines().length === 0 ? 'Добавьте первое лекарство — и оно появится здесь.' : 'Попробуйте изменить поиск или фильтр.'}</p>
      ${getMedicines().length === 0 ? '<button class="btn-primary" onclick="openModal()">+ Добавить лекарство</button>' : ''}
    </div>`;
    return;
  }

  grid.innerHTML = list.map(m => {
    const st = getStatus(m.expiry);
    return `<div class="med-card ${st}">
      <div class="med-header"><h3>${esc(m.name)}</h3><span class="badge ${st}">${STATUS_LABELS[st]}</span></div>
      <p><strong>Назначение:</strong> ${esc(m.purpose) || '—'}</p>
      <p><strong>Количество:</strong> ${m.quantity} ${esc(m.unit)}</p>
      <p><strong>Годен до:</strong> ${formatDate(m.expiry)}</p>
      ${m.dosage ? `<p><strong>Дозировка:</strong> ${esc(m.dosage)}</p>` : ''}
      <div class="med-actions">
        <button class="btn-mini" onclick="editMedicine('${m.id}')">Изменить</button>
        <button class="btn-mini danger" onclick="deleteMedicine('${m.id}')">Удалить</button>
      </div>
    </div>`;
  }).join('');
}

function saveMedicine() {
  const name = val('med-name').trim();
  const purpose = val('med-purpose').trim();
  const quantity = val('med-quantity').trim();
  const unit = val('med-unit');
  const expiry = val('med-expiry');
  const dosage = val('med-dosage').trim();

  if (!name || !quantity || !expiry) {
    alert('Заполните название, количество и срок годности.');
    return;
  }

  const list = getMedicines();
  const editId = val('med-edit-id');
  const data = { name, purpose, quantity: Number(quantity), unit, expiry, dosage };

  if (editId) {
    const m = list.find(x => x.id === editId);
    if (m) Object.assign(m, data);
  } else {
    list.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data });
  }

  saveMedicines(list);
  closeModal();
  renderMedicines();
}

function editMedicine(id) {
  const m = getMedicines().find(x => x.id === id);
  if (!m) return;
  setVal('med-edit-id', m.id);
  setVal('med-name', m.name);
  setVal('med-purpose', m.purpose || '');
  setVal('med-quantity', m.quantity);
  setVal('med-unit', m.unit);
  setVal('med-expiry', m.expiry);
  setVal('med-dosage', m.dosage || '');
  document.getElementById('modal-title').innerText = 'Изменить лекарство';
  openModal();
}

function deleteMedicine(id) {
  const m = getMedicines().find(x => x.id === id);
  if (!m) return;
  if (!confirm(`Удалить «${m.name}»?`)) return;
  saveMedicines(getMedicines().filter(x => x.id !== id));
  renderMedicines();
}

// ===== ПЕРЕХОД МЕЖДУ ЭКРАНАМИ =====
function openApp() {
  if (!getSession()) { openAuth(); return; }
  enterApp();
}
function enterApp() {
  document.getElementById('landing').classList.remove('active');
  document.getElementById('app').classList.add('active');
  if (document.getElementById('bg-blobs')) document.getElementById('bg-blobs').style.display = 'none';
  window.scrollTo(0, 0);
  renderProfile();
  renderMedicines();
  renderReminders();
  renderFamily();
}
function closeApp() {
  document.getElementById('app').classList.remove('active');
  document.getElementById('landing').classList.add('active');
  if (document.getElementById('bg-blobs')) document.getElementById('bg-blobs').style.display = 'block';
  window.scrollTo(0, 0);
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchTab(name) {
  document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.side-link[data-tab="${name}"]`).classList.add('active');

  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  const targetSection = document.getElementById('tab-' + name);
  if (targetSection) {
    targetSection.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ===== МОДАЛКИ =====
function openModal() {
  document.getElementById('med-edit-id').value = '';
  document.getElementById('modal-title').innerText = 'Добавить лекарство';
  ['med-name', 'med-purpose', 'med-quantity', 'med-expiry', 'med-dosage'].forEach(id => setVal(id, ''));
  document.getElementById('modal').classList.add('active');
}
function closeModal() { document.getElementById('modal').classList.remove('active'); }
function showStub(title, text) {
  document.getElementById('stub-title').innerText = title;
  document.getElementById('stub-text').innerText = text;
  document.getElementById('stub').classList.add('active');
}
function closeStub() { document.getElementById('stub').classList.remove('active'); }

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
});

// ===== АНИМАЦИЯ ПОЯВЛЕНИЯ =====
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== ДЕМО-ВХОД =====
async function guestLogin() {
  const email = 'guest@capsula.ru';
  const users = getUsers();
  if (!users.some(u => u.email === email)) {
    const hash = await hashPassword('guest123');
    users.push({ name: 'Гость', email, hash });
    saveUsers(users);
  }
  seedGuestData(email);
  localStorage.setItem('capsula_session', email);
  closeAuth();
  enterApp();
}

function seedGuestData(email) {
  const plusDays = d => {
    const x = new Date(); x.setDate(x.getDate() + d);
    return x.toISOString().slice(0, 10);
  };
  const medKey = 'capsula_medicines_' + email;
  if (!localStorage.getItem(medKey)) {
    localStorage.setItem(medKey, JSON.stringify([
      { id: 'g1', name: 'Парацетамол', purpose: 'головная боль, температура', quantity: 12, unit: 'таб.', expiry: plusDays(200), dosage: '500 мг' },
      { id: 'g2', name: 'Витамин С', purpose: 'иммунитет', quantity: 8, unit: 'таб.', expiry: plusDays(10), dosage: '' },
      { id: 'g3', name: 'Аспирин', purpose: 'боль, жар', quantity: 5, unit: 'таб.', expiry: '2024-01-01', dosage: '' },
      { id: 'g4', name: 'Магний B6', purpose: 'нервы, сон', quantity: 40, unit: 'капс.', expiry: plusDays(500), dosage: '' }
    ]));
  }
  const remKey = 'capsula_reminders_' + email;
  if (!localStorage.getItem(remKey)) {
    localStorage.setItem(remKey, JSON.stringify([
      { id: 'r1', medicine: 'Парацетамол', time: '08:00', note: 'После завтрака' },
      { id: 'r2', medicine: 'Витамин С', time: '20:00', note: '' }
    ]));
  }
  const famKey = 'capsula_family_' + email;
  if (!localStorage.getItem(famKey)) {
    localStorage.setItem(famKey, JSON.stringify([
      { id: 'f1', name: 'Мама', role: 'мама', avatar: '👵' },
      { id: 'f2', name: 'Артём', role: 'сын', avatar: '👦' }
    ]));
  }
}

// ===== НАПОМИНАНИЯ =====
function getReminders() {
  const email = getSession();
  if (!email) return [];
  try { return JSON.parse(localStorage.getItem('capsula_reminders_' + email) || '[]'); }
  catch { return []; }
}
function saveReminders(list) {
  const email = getSession();
  if (!email) return;
  localStorage.setItem('capsula_reminders_' + email, JSON.stringify(list));
}
function renderReminders() {
  const container = document.getElementById('reminders-list');
  const list = getReminders();
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔔</div>
      <h3>Пока нет напоминаний</h3>
      <p>Настрой график приёма — и мы будем напоминать в нужное время.</p>
      <button class="btn-primary" onclick="openReminderModal()">Настроить график</button>
    </div>`;
    return;
  }
  container.innerHTML = list.map(r => `<div class="reminder-item">
    <div class="reminder-icon">💊</div>
    <div class="reminder-info"><h4>${esc(r.medicine)}</h4><p>${r.time}${r.note ? ' · ' + esc(r.note) : ''}</p></div>
    <button class="btn-mini danger" onclick="deleteReminder('${r.id}')">Удалить</button>
  </div>`).join('');
}
function openReminderModal() {
  const sel = document.getElementById('rem-medicine');
  const meds = getMedicines();
  sel.innerHTML = meds.length
    ? meds.map(m => `<option>${esc(m.name)}</option>`).join('')
    : '<option value="">Сначала добавьте лекарство</option>';
  setVal('rem-time', '');
  setVal('rem-note', '');
  document.getElementById('reminder-modal').classList.add('active');
}
function closeReminderModal() { document.getElementById('reminder-modal').classList.remove('active'); }
function saveReminder() {
  const medicine = val('rem-medicine');
  const time = val('rem-time');
  const note = val('rem-note').trim();
  if (!medicine || !time) { alert('Выберите лекарство и время.'); return; }
  const list = getReminders();
  list.push({ id: 'r' + Date.now().toString(36), medicine, time, note });
  saveReminders(list);
  closeReminderModal();
  renderReminders();
}
function deleteReminder(id) {
  saveReminders(getReminders().filter(r => r.id !== id));
  renderReminders();
}

// ===== СЕМЬЯ =====
function getFamily() {
  const email = getSession();
  if (!email) return [];
  try { return JSON.parse(localStorage.getItem('capsula_family_' + email) || '[]'); }
  catch { return []; }
}
function saveFamily(list) {
  const email = getSession();
  if (!email) return;
  localStorage.setItem('capsula_family_' + email, JSON.stringify(list));
}
function renderFamily() {
  const grid = document.getElementById('family-grid');
  const list = getFamily();
  grid.innerHTML = list.map(f => `<div class="family-card">
    <div class="avatar">${esc(f.avatar)}</div><h3>${esc(f.name)}</h3><p class="subtitle">${esc(f.role) || 'член семьи'}</p>
    <div class="med-actions"><button class="btn-mini danger" onclick="deleteFamilyMember('${f.id}')">Удалить</button></div>
  </div>`).join('') + `<div class="family-card add" onclick="openFamilyModal()">
    <div class="avatar">+</div><h3>Добавить</h3>
  </div>`;
}
function openFamilyModal() {
  setVal('family-name', '');
  setVal('family-role', '');
  document.getElementById('family-modal').classList.add('active');
}
function closeFamilyModal() { document.getElementById('family-modal').classList.remove('active'); }
function saveFamilyMember() {
  const name = val('family-name').trim();
  const role = val('family-role').trim();
  const avatar = val('family-avatar');
  if (!name) { alert('Введите имя.'); return; }
  const list = getFamily();
  list.push({ id: 'f' + Date.now().toString(36), name, role, avatar });
  saveFamily(list);
  closeFamilyModal();
  renderFamily();
}
function deleteFamilyMember(id) {
  saveFamily(getFamily().filter(f => f.id !== id));
  renderFamily();
}
