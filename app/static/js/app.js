const donateForm = document.querySelector('#donateForm');
const applyForm = document.querySelector('#applyForm');
const trackForm = document.querySelector('#trackForm');
const adminForm = document.querySelector('#adminForm');
const adminLoginForm = document.querySelector('#adminLoginForm');
const adminLogoutBtn = document.querySelector('#adminLogoutBtn');

const donateResult = document.querySelector('#donateResult');
const applyResult = document.querySelector('#applyResult');
const trackResult = document.querySelector('#trackResult');
const adminResult = document.querySelector('#adminResult');
const adminLoginResult = document.querySelector('#adminLoginResult');

const modalOpenButtons = document.querySelectorAll('[data-modal-open]');
const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
const modals = document.querySelectorAll('.modal');

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }
}

function closeModals() {
  modals.forEach((modal) => modal.classList.add('hidden'));
  document.body.classList.remove('modal-open');
}

modalOpenButtons.forEach((button) => {
  button.addEventListener('click', () => openModal(button.dataset.modalOpen));
});

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', closeModals);
});

modals.forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModals();
    }
  });
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
    const formData = new FormData(applyForm);
    const supportingDocs = formData.getAll('docs');

    const payload = {
      full_name: String(formData.get('full_name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      state: String(formData.get('state') || '').trim(),
      income: Number(formData.get('income') || 0),
      need_summary: [
        `Purpose: ${String(formData.get('funding_purpose') || '').trim()}`,
        `Personal statement: ${String(formData.get('personal_statement') || '').trim()}`,
        `Budget breakdown: ${String(formData.get('budget_breakdown') || '').trim()}`,
        `Expected outcomes: ${String(formData.get('impact_outcomes') || '').trim()}`,
        `Financial hardship: ${String(formData.get('financial_hardship') || '').trim()}`,
        `Profile: DOB ${String(formData.get('date_of_birth') || '').trim()}, Phone ${String(formData.get('phone_number') || '').trim()}, Address ${String(formData.get('address') || '').trim()}, Residency ${String(formData.get('residency_status') || '').trim()}, SSN(last4) ${String(formData.get('ssn_last4') || '').trim()}`,
        `Eligibility: Enrolled=${String(formData.get('enrolled_in_school') || '').trim()}, Employed=${String(formData.get('employed') || '').trim()}, Income threshold=${String(formData.get('income_threshold') || '').trim()}, Underserved community=${String(formData.get('underserved_community') || '').trim()}`,
        `Amount requested: ${String(formData.get('amount_requested') || '').trim()}`,
        `Supporting documents: ${supportingDocs.length ? supportingDocs.join(', ') : 'None selected'}`,
      ].filter((line) => !line.endsWith(': ')).join('\n'),
    };

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

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(adminLoginForm).entries());

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      adminLoginResult.textContent = data.error || 'Login failed.';
      adminLoginResult.className = 'message error';
      return;
    }

    window.location.href = '/admin';
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

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin';
  });
}
