const donateForm = document.querySelector('#donateForm');
const applyForm = document.querySelector('#applyForm');
const trackForm = document.querySelector('#trackForm');
const adminForm = document.querySelector('#adminForm');
const adminLoginForm = document.querySelector('#adminLoginForm');
const adminLogoutBtn = document.querySelector('#adminLogoutBtn');
const testimonialForm = document.querySelector('#testimonialForm');

const donateResult = document.querySelector('#donateResult');
const applyResult = document.querySelector('#applyResult');
const trackResult = document.querySelector('#trackResult');
const adminResult = document.querySelector('#adminResult');
const adminLoginResult = document.querySelector('#adminLoginResult');
const testimonialResult = document.querySelector('#testimonialResult');
const testimonialAdminList = document.querySelector('#testimonialAdminList');

const modalOpenButtons = document.querySelectorAll('[data-modal-open]');
const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
const modals = document.querySelectorAll('.modal');

const storyCards = document.querySelectorAll('.story-card');
const storyDots = document.querySelectorAll('.story-dot');
const heroSection = document.querySelector('.hero');
const countUpElements = document.querySelectorAll('.count-up');

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
let testimonialCache = [];

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

  if (photoModalImage) {
    photoModalImage.src = '';
  }
  if (photoModalCaption) {
    photoModalCaption.textContent = '';
  }
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

function animateCounters() {
  if (!countUpElements.length) {
    return;
  }

  countUpElements.forEach((element) => {
    const target = Number(element.dataset.target || 0);
    const suffix = element.dataset.suffix || '';
    const hasThousands = target >= 1000;
    let current = 0;
    const increment = Math.max(1, Math.round(target / 70));

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
      }

      const formatted = hasThousands ? current.toLocaleString('en-US') : String(current);
      element.textContent = `${formatted}${suffix}`;

      if (current === target) {
        clearInterval(timer);
      }
    }, 20);
  });
}

function setActiveStory(index) {
  storyCards.forEach((card) => {
    card.classList.toggle('active', card.dataset.story === String(index));
  });

  storyDots.forEach((dot) => {
    dot.classList.toggle('active', dot.dataset.storyTarget === String(index));
  });

  if (heroSection) {
    const heroGradients = [
      'linear-gradient(135deg, #0a2f7d, #0e53cf)',
      'linear-gradient(135deg, #0d4fcc, #1a7ce6)',
      'linear-gradient(135deg, #093a96, #138d75)',
    ];
    heroSection.style.background = heroGradients[index % heroGradients.length];
  }
}

function initializeStoryCarousel() {
  if (!storyCards.length || !storyDots.length) {
    return;
  }

  let currentStory = 0;

  storyDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      currentStory = Number(dot.dataset.storyTarget || 0);
      setActiveStory(currentStory);
    });
  });

  setInterval(() => {
    currentStory = (currentStory + 1) % storyCards.length;
    setActiveStory(currentStory);
  }, 5000);
}

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

if (testimonialForm) {
  loadAdminTestimonials();

  testimonialForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(testimonialForm);
    const payload = {
      id: formData.get('id') ? Number(formData.get('id')) : null,
      full_name: String(formData.get('full_name') || '').trim(),
      role_title: String(formData.get('role_title') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      quote: String(formData.get('quote') || '').trim(),
      is_featured: formData.get('is_featured') === 'on',
    };

    const response = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      testimonialResult.textContent = data.error || 'Unable to save testimonial.';
      testimonialResult.className = 'message error';
      return;
    }

    testimonialResult.textContent = `Saved testimonial for ${data.testimonial.full_name}.`;
    testimonialResult.className = 'message success';
    testimonialForm.reset();
    testimonialForm.elements.id.value = '';
    testimonialForm.elements.is_featured.checked = true;
    await loadAdminTestimonials();
  });
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin';
  });
}

animateCounters();
initializeStoryCarousel();
