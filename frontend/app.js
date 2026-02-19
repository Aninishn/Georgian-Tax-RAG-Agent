const API = 'https://georgian-tax-rag-agent.onrender.com';
const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9);
let isLoading = false;
let questionCount = parseInt(localStorage.getItem('questionCount') || '0');

// ── Fun facts about Georgian tax system ──────────────────────────────────────
const FUN_FACTS = [
  "საქართველო მსოფლიოში ერთ-ერთი ყველაზე დაბალი გადასახადების ქვეყანაა — მხოლოდ 6 ძირითადი გადასახადი!",
  "2017 წლიდან საქართველომ მიიღო ესტონური მოდელი — გაუნაწილებელი მოგება გადასახადით არ იბეგრება.",
  "საქართველოს DCFTA შეთანხმება ევროკავშირთან 27 000-ზე მეტ პროდუქტზე ნულოვან ბაჟს ითვალისწინებს.",
  "IT კომპანიები ვირტუალური ზონის სტატუსით საექსპორტო შემოსავლიდან გათავისუფლებულია გადასახადებისაგან.",
  "მიკრო ბიზნესი 30 000 ლარამდე ბრუნვით სრულად გათავისუფლებულია საშემოსავლო გადასახადისაგან.",
  "საქართველოს საბაჟო სამსახური ერთ-ერთი ყველაზე სწრაფია — საშუალოდ 3 საათში ათავისუფლებს საქონელს.",
  "300 ლარამდე ფოსტით შემოტანილ საქონელზე არ გამოიყენება არც ბაჟი და არც დღგ.",
];

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

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  // Build suggested buttons
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

  // Show rotating fun fact
  rotateFunFact();

  // Update counters
  updateCounters();
}

function rotateFunFact() {
  const el = document.getElementById('funFact');
  if (!el) return;
  let i = 0;
  el.textContent = FUN_FACTS[i];
  setInterval(() => {
    el.style.opacity = '0';
    setTimeout(() => {
      i = (i + 1) % FUN_FACTS.length;
      el.textContent = FUN_FACTS[i];
      el.style.opacity = '1';
    }, 400);
  }, 5000);
}

function updateCounters() {
  document.getElementById('statQuestions').textContent = questionCount;
  document.getElementById('sidebarCount').textContent = questionCount;
}

// ── Send query ────────────────────────────────────────────────────────────────
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

  const startTime = Date.now();

  try {
    const res = await fetch(`${API}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, session_id: SESSION_ID }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    removeTyping(typingId);
    appendAgentMessage(data.answer, data.sources, elapsed);

    // Update question counter
    questionCount++;
    localStorage.setItem('questionCount', questionCount);
    updateCounters();

  } catch (err) {
    removeTyping(typingId);
    appendError('შეცდომა: ' + err.message + '\n\nდარწმუნდით რომ backend სერვერი გაშვებულია.');
  } finally {
    isLoading = false;
    document.getElementById('sendBtn').disabled = false;
  }
}

// ── Append user message ───────────────────────────────────────────────────────
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

// ── Append agent message with extras ─────────────────────────────────────────
function appendAgentMessage(text, sources, elapsed) {
  const c = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'message agent';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  // Format text
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n/g, '<br>');

  bubble.innerHTML = formatted;

  // Sources tags
  if (sources && sources.length > 0) {
    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'sources-used';
    sources.forEach(s => {
      const tag = document.createElement('span');
      tag.className = 'source-tag';
      tag.textContent = '📄 ' + s.title;
      sourcesDiv.appendChild(tag);
    });
    bubble.appendChild(sourcesDiv);
  }

  // Meta row: time + copy button
  const meta = document.createElement('div');
  meta.className = 'response-meta';

  const timeEl = document.createElement('span');
  timeEl.className = 'response-time';
  timeEl.textContent = `⚡ ${elapsed}წ-ში პასუხი`;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.innerHTML = '📋 კოპირება';
  copyBtn.onclick = () => copyText(text, copyBtn);

  meta.appendChild(timeEl);
  meta.appendChild(copyBtn);
  bubble.appendChild(meta);

  div.appendChild(avatar);
  div.appendChild(bubble);
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

// ── Copy to clipboard ─────────────────────────────────────────────────────────
function copyText(text, btn) {
  // Strip markdown
  const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  navigator.clipboard.writeText(clean).then(() => {
    btn.innerHTML = '✅ დაკოპირდა!';
    btn.classList.add('copied');
    showToast('პასუხი დაკოპირდა!');
    setTimeout(() => {
      btn.innerHTML = '📋 კოპირება';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ── Toast notification ────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ── Error ─────────────────────────────────────────────────────────────────────
function appendError(text) {
  const c = document.getElementById('messagesContainer');
  const div = document.createElement('div');
  div.className = 'error-bubble';
  div.style.whiteSpace = 'pre-line';
  div.textContent = text;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
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
  bubble.innerHTML = `<div class="typing-indicator">
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

// ── Reset session ─────────────────────────────────────────────────────────────
async function resetSession() {
  await fetch(`${API}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: SESSION_ID }),
  }).catch(() => {});

  document.getElementById('messagesContainer').innerHTML = `
    <div class="welcome-state">
      <div class="welcome-icon">⚖️</div>
      <h3>საუბრის ისტორია გასუფთავდა</h3>
      <p>დასვით ახალი კითხვა.</p>
      <div class="fun-fact" id="funFact"></div>
    </div>`;
  rotateFunFact();
}

// ── Keyboard shortcut ─────────────────────────────────────────────────────────
document.getElementById('queryInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sendQuery();
  }
  setTimeout(() => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px';
  }, 0);
});

// ── Start ─────────────────────────────────────────────────────────────────────
init();