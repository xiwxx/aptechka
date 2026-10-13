// ===== КУРСОР =====
const dot = document.getElementById('cursor-dot');
const circle = document.getElementById('cursor-circle');
let mouseX = 0, mouseY = 0;
let circleX = 0, circleY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = mouseX + 'px';
  dot.style.top = mouseY + 'px';
});

function animateCircle() {
  circleX += (mouseX - circleX) * 0.15;
  circleY += (mouseY - circleY) * 0.15;
  circle.style.left = circleX + 'px';
  circle.style.top = circleY + 'px';
  requestAnimationFrame(animateCircle);
}
animateCircle();

// Увеличение курсора при наведении на кнопки/ссылки
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

// ===== ПЕРЕХОД МЕЖДУ ЭКРАНАМИ =====
function openApp() {
  document.getElementById('landing').classList.remove('active');
  document.getElementById('app').classList.add('active');
  window.scrollTo(0, 0);
}
function closeApp() {
  document.getElementById('app').classList.remove('active');
  document.getElementById('landing').classList.add('active');
  window.scrollTo(0, 0);
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`.side-link[data-tab="${name}"]`).classList.add('active');
}

// ===== МОДАЛКА: ДОБАВЛЕНИЕ =====
function openModal() {
  document.getElementById('modal').classList.add('active');
}
function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// ===== МОДАЛКА: ЗАГЛУШКА =====
function showStub(title, text) {
  document.getElementById('stub-title').innerText = title;
  document.getElementById('stub-text').innerText = text;
  document.getElementById('stub').classList.add('active');
}
function closeStub() {
  document.getElementById('stub').classList.remove('active');
}

// Закрытие по клику вне модалки
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('active');
  });
});

// ===== REVEAL АНИМАЦИЯ =====
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));