const API = 'https://georgian-tax-rag-agent.onrender.com';
const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9);
let isLoading = false;

const SUGGESTED = [
  "საშემოსავლო გადასახადის განაკვეთი?",
  "დღგ-ზე რეგისტრაციის ვალდებულება?",
  "მოგების გადასახადის ესტონური მოდელი?",
  "მცირე ბიზნესის სტატუსი?",
  "ავტომობილის შემოტანის ბაჟი?",
  "ექსპორტზე დღგ-ის განაკვეთი?",
  "ქონების გადასახადი?",
  "გადამხდელის უფლებები?",
];

// ── Build suggested questions ─────────────────────────────────────────────
const sc = document.getElementById('suggestedContainer');
SUGGESTED.forEach(q => {
  const btn = document.createElement('button');
  btn.className = 'suggested-btn';
  btn.textContent = q;
  btn.onclick = () => {
    document.getElementById('queryInput').value = q;
    sendQuery();
  };
  sc.appendChild(btn);
});

// ── Send query ────────────────────────────────────────────────────────────
async function sendQuery() {
  if (isLoading) return;

  const input = document.getElementById('queryInput');
  const query = input.value.trim();
  if (!query) return;

  const welcome = document.getElementById('welcomeState');
  if (welcome) welcome.remove();

  appendMessage('user', query);
  input.value = '';
  input.style.height = 'auto';

  const typingId = showTyping();
  isLoading = true;
  document.getElementById('sendBtn').disabled = true;

  try {
    const res = await fetch(`${API}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, session_id: SESSION_ID }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    removeTyping(typingId);
    appendMessage('agent', data.answer);

  } catch (err) {
    removeTyping(typingId);
    appendError('შეცდომა: ' + err.message + '\n\nდარწმუნდით რომ backend სერვერი გაშვებულია:\npython backend/main.py');
  } finally {
    isLoading = false;
    document.getElementById('sendBtn').disabled = false;
  }
}

// ── Append message bubble ─────────────────────────────────────────────────
function appendMessage(role, text) {
  const c = document.getElementById('messagesContainer');

  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n/g, '<br>');

  div.appendChild(avatar);
  div.appendChild(bubble);
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

// ── Append error ──────────────────────────────────────────────────────────
function appendError(text) {
  const c = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'error-bubble';
  div.style.whiteSpace = 'pre-line';
  div.textContent = text;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

// ── Typing indicator ──────────────────────────────────────────────────────
function showTyping() {
  const c = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'message agent';
  const id = 'typing_' + Date.now();
  div.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;

  div.appendChild(avatar);
  div.appendChild(bubble);
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── Reset session ─────────────────────────────────────────────────────────
async function resetSession() {
  await fetch(`${API}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: SESSION_ID }),
  }).catch(() => {});

  const c = document.getElementById('messagesContainer');
  c.innerHTML = `
    <div class="welcome-state">
      <div class="welcome-icon">⚖️</div>
      <h3>საუბრის ისტორია გასუფთავდა</h3>
      <p>დასვით ახალი კითხვა.</p>
    </div>`;
}

// ── Keyboard shortcut: Ctrl+Enter to send ────────────────────────────────
document.getElementById('queryInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sendQuery();
  }
  // Auto-resize textarea
  setTimeout(() => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px';
  }, 0);
});
