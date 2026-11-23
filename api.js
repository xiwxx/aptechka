// ===== СЛОЙ API: все разговоры фронтенда с сервером Capsula =====
// Сервер: FastAPI + SQLite, доступен локально или через ngrok (см. config.js).

// ---------- токен ----------
const TOKEN_KEY = 'capsula_token';
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

// ---------- базовый запрос ----------
async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {
    // Отключаем страницу-предупреждение бесплатного ngrok для запросов из браузера
    'ngrok-skip-browser-warning': 'true',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && getToken()) headers['Authorization'] = 'Bearer ' + getToken();

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Сервер недоступен. Проверьте, что запущены uvicorn и ngrok.');
  }

  if (res.status === 204) return null; // успешное удаление без тела

  let data = null;
  try { data = await res.json(); } catch (e) { /* ответ без JSON */ }

  if (!res.ok) {
    if (res.status === 401 && auth) clearToken(); // токен протух — разлогиним
    throw new Error((data && data.detail) || ('Ошибка сервера: ' + res.status));
  }
  return data;
}

// ---------- аутентификация ----------
const apiRegister = (name, email, password) =>
  api('/register', { method: 'POST', body: { name, email, password }, auth: false });
const apiLogin = (email, password) =>
  api('/login', { method: 'POST', body: { email, password }, auth: false });
const apiMe = () => api('/me');
const apiUpdateProfile = (data) => api('/me', { method: 'PUT', body: data });

// ---------- лекарства ----------
const apiMedicines = () => api('/medicines');
const apiAddMedicine = (data) => api('/medicines', { method: 'POST', body: data });
const apiUpdateMedicine = (id, data) => api(`/medicines/${id}`, { method: 'PUT', body: data });
const apiDeleteMedicine = (id) => api(`/medicines/${id}`, { method: 'DELETE' });

// ---------- напоминания ----------
const apiReminders = () => api('/reminders');
const apiAddReminder = (data) => api('/reminders', { method: 'POST', body: data });
const apiDeleteReminder = (id) => api(`/reminders/${id}`, { method: 'DELETE' });

// ---------- семья ----------
const apiFamily = () => api('/family');
const apiAddFamily = (data) => api('/family', { method: 'POST', body: data });
const apiDeleteFamily = (id) => api(`/family/${id}`, { method: 'DELETE' });
