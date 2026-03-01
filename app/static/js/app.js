const grantsGrid = document.querySelector('#grantsGrid');
const statsEl = document.querySelector('#stats');
const savedList = document.querySelector('#savedList');
const minAward = document.querySelector('#minAward');
const minAwardLabel = document.querySelector('#minAwardLabel');

const savedKey = 'us-grant-hub-saved';
let grantsCache = [];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

async function loadStats() {
  const res = await fetch('/api/stats');
  const data = await res.json();
  statsEl.innerHTML = `
    <strong>${data.total_grants}</strong> open grants •
    Avg max award: <strong>${currency.format(data.avg_max_award)}</strong> •
    Categories: ${data.categories.join(', ')}
  `;
}

function getSaved() {
  return JSON.parse(localStorage.getItem(savedKey) || '[]');
}

function saveGrant(id) {
  const current = new Set(getSaved());
  current.has(id) ? current.delete(id) : current.add(id);
  localStorage.setItem(savedKey, JSON.stringify([...current]));
  renderSaved();
  renderGrants(grantsCache);
}

function renderSaved() {
  const saved = new Set(getSaved());
  const items = grantsCache.filter((g) => saved.has(g.id));
  savedList.innerHTML = items.length
    ? items.map((g) => `<li>${g.title} (${g.deadline})</li>`).join('')
    : '<li>No saved grants yet.</li>';
}

function renderGrants(grants) {
  const saved = new Set(getSaved());
  grantsGrid.innerHTML = grants
    .map((grant) => `
      <article class="grant-card">
        <img src="${grant.image}?auto=format&fit=crop&w=900&q=70" alt="${grant.title}" loading="lazy" />
        <div class="grant-content">
          <h4>${grant.title}</h4>
          <p>${grant.description}</p>
          <p class="grant-meta">${grant.agency} • ${grant.category}</p>
          <p class="grant-meta">${currency.format(grant.award_min)} - ${currency.format(grant.award_max)} • Deadline: ${grant.deadline}</p>
          <button data-id="${grant.id}">${saved.has(grant.id) ? 'Unsave' : 'Save'} Grant</button>
        </div>
      </article>
    `)
    .join('');

  grantsGrid.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => saveGrant(Number(btn.dataset.id)));
  });
}

async function fetchGrants() {
  const search = document.querySelector('#searchInput').value;
  const category = document.querySelector('#categoryFilter').value;
  const state = document.querySelector('#stateFilter').value;
  const min = minAward.value;
  minAwardLabel.textContent = `${currency.format(min)} minimum`;

  const params = new URLSearchParams({ search, category, state, min_award: min });
  const res = await fetch(`/api/grants?${params.toString()}`);
  grantsCache = await res.json();
  renderGrants(grantsCache);
  renderSaved();
}

async function runEligibility(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    entity_type: form.entity_type.value,
    project_stage: form.project_stage.value,
    budget: form.budget.value,
    in_us: form.in_us.checked,
  };
  const res = await fetch('/api/eligibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  document.querySelector('#eligibilityResult').textContent = `Eligibility: ${data.verdict} (${data.score}/100)`;
}

async function submitContact(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    name: form.name.value,
    email: form.email.value,
    message: form.message.value,
  };
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  document.querySelector('#contactResult').textContent = data.message || data.error;
  if (data.ok) {
    form.reset();
  }
}

function initTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') document.body.classList.add('dark');
  document.querySelector('#themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

function init() {
  initTheme();
  loadStats();
  fetchGrants();

  ['#searchInput', '#categoryFilter', '#stateFilter', '#minAward'].forEach((selector) => {
    document.querySelector(selector).addEventListener('input', fetchGrants);
  });

  document.querySelector('#eligibilityForm').addEventListener('submit', runEligibility);
  document.querySelector('#contactForm').addEventListener('submit', submitContact);
}

init();
