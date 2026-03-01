const grantsGrid = document.querySelector('#grantsGrid');
const statsEl = document.querySelector('#stats');

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function renderStats(data) {
  statsEl.innerHTML = `
    <strong>${data.total_grants}</strong> active programs •
    Typical award range: <strong>${currency.format(data.avg_min_award)}</strong> to <strong>${currency.format(data.avg_max_award)}</strong> •
    Focus areas: ${data.categories.join(', ')}
  `;
}

function renderPrograms(grants) {
  grantsGrid.innerHTML = grants
    .map((grant) => `
      <article class="grant-card">
        <img src="${grant.image}?auto=format&fit=crop&w=900&q=70" alt="${grant.title}" loading="lazy" />
        <div class="grant-content">
          <h4>${grant.title}</h4>
          <p>${grant.description}</p>
          <p class="grant-meta">Program Area: ${grant.category}</p>
          <p class="grant-meta">${currency.format(grant.award_min)} - ${currency.format(grant.award_max)} • Apply by ${grant.deadline}</p>
        </div>
      </article>
    `)
    .join('');
}

async function loadPrograms() {
  const [grantsRes, statsRes] = await Promise.all([fetch('/api/grants'), fetch('/api/stats')]);
  const grants = await grantsRes.json();
  const stats = await statsRes.json();
  renderPrograms(grants);
  renderStats(stats);
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
  document.querySelector('#eligibilityResult').textContent = `Estimated eligibility: ${data.verdict} (${data.score}/100)`;
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
  loadPrograms();

  document.querySelector('#eligibilityForm').addEventListener('submit', runEligibility);
  document.querySelector('#contactForm').addEventListener('submit', submitContact);
}

init();
