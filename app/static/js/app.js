const donateForm = document.querySelector('#donateForm');
const applyForm = document.querySelector('#applyForm');
const trackForm = document.querySelector('#trackForm');
const adminForm = document.querySelector('#adminForm');

const donateResult = document.querySelector('#donateResult');
const applyResult = document.querySelector('#applyResult');
const trackResult = document.querySelector('#trackResult');
const adminResult = document.querySelector('#adminResult');

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const tabTriggerButtons = document.querySelectorAll('[data-tab-target]');

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function activateTab(tabId) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabId;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => activateTab(button.dataset.tab));
});

tabTriggerButtons.forEach((button) => {
  button.addEventListener('click', () => activateTab(button.dataset.tabTarget));
});

if (donateForm) {
  donateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(donateForm).entries());
    payload.amount = Number(payload.amount || 0);

    const response = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      donateResult.textContent = data.error || 'Donation failed.';
      donateResult.className = 'message error';
      return;
    }

    donateResult.innerHTML = `Thank you! Donation reference: <strong>${data.donation_id}</strong>.`;
    donateResult.className = 'message success';
    donateForm.reset();
  });
}

if (applyForm) {
  applyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(applyForm).entries());
    payload.income = Number(payload.income || 0);

    const response = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      applyResult.textContent = data.error || 'Unable to submit application.';
      applyResult.className = 'message error';
      return;
    }

    applyResult.innerHTML = `Application submitted. Your ID is <strong>${data.application_id}</strong>. Keep it safe.`;
    applyResult.className = 'message success';
    applyForm.reset();
    activateTab('monitor-tab');
  });
}

if (trackForm) {
  trackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(trackForm);
    const applicationId = formData.get('application_id');
    const email = formData.get('email');

    const response = await fetch(`/api/application/${encodeURIComponent(applicationId)}?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (!response.ok) {
      trackResult.classList.remove('hidden');
      trackResult.innerHTML = `<p class="error">${data.error || 'Application not found.'}</p>`;
      return;
    }

    const app = data.application;
    trackResult.classList.remove('hidden');
    trackResult.innerHTML = `
      <h3>${app.full_name} (${app.application_id})</h3>
      <ul>
        <li><strong>Status:</strong> ${app.status}</li>
        <li><strong>Qualified Amount:</strong> ${money.format(app.qualified_amount)}</li>
        <li><strong>Approved Amount:</strong> ${money.format(app.approved_amount)}</li>
        <li><strong>Last Updated:</strong> ${new Date(app.updated_at).toLocaleString()}</li>
      </ul>
      <p><strong>Admin Note:</strong> ${app.admin_note || 'No note yet.'}</p>
    `;
  });
}

if (adminForm) {
  adminForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(adminForm).entries());
    payload.qualified_amount = Number(payload.qualified_amount || 0);
    payload.approved_amount = Number(payload.approved_amount || 0);

    const response = await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      adminResult.textContent = data.error || 'Update failed.';
      adminResult.className = 'message error';
      return;
    }

    adminResult.textContent = `Updated ${data.application.application_id} successfully.`;
    adminResult.className = 'message success';
  });
}
