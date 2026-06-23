import * as ContactValidation from './lib/contact-validation.mjs';

const SUBMIT_COOLDOWN_MS = 30000;
const SUBMIT_COOLDOWN_KEY = 'tboy1337-contact-last-submit';

/**
 * @param {HTMLFormElement} form
 * @param {HTMLButtonElement} submitBtn
 * @param {HTMLElement} submitText
 * @param {HTMLElement} formStatus
 * @param {HTMLElement} successMessage
 * @param {HTMLElement} errorMessage
 * @param {HTMLElement} errorText
 */
function initContactForm(form, submitBtn, submitText, formStatus, successMessage, errorMessage, errorText) {
  /** @param {unknown} name */
  function validateName(name) {
    return ContactValidation.validateName(String(name ?? ''));
  }

  /** @param {unknown} email */
  function validateEmail(email) {
    return ContactValidation.validateEmail(String(email ?? ''));
  }

  /** @param {unknown} subject */
  function validateSubject(subject) {
    return ContactValidation.validateSubject(String(subject ?? ''));
  }

  /** @param {unknown} message */
  function validateMessage(message) {
    return ContactValidation.validateMessage(String(message ?? ''));
  }

  /** @param {string} fieldId @param {string} message */
  function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + '-error');
    const inputElement = document.getElementById('contact-' + fieldId);

    if (!errorElement || !inputElement) {
      return;
    }

    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    inputElement.classList.add('border-red-500');
    inputElement.classList.remove('border-white/20');
    inputElement.setAttribute('aria-invalid', 'true');
  }

  /** @param {string} fieldId */
  function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + '-error');
    const inputElement = document.getElementById('contact-' + fieldId);

    if (!errorElement || !inputElement) {
      return;
    }

    errorElement.classList.add('hidden');
    inputElement.classList.remove('border-red-500');
    inputElement.classList.add('border-white/20');
    inputElement.removeAttribute('aria-invalid');
  }

  function clearAllErrors() {
    ['name', 'email', 'subject', 'message'].forEach(clearError);
  }

  /** @param {'success' | 'error'} type @param {string} [message] */
  function showFormStatus(type, message = '') {
    formStatus.classList.remove('hidden');

    if (type === 'success') {
      successMessage.classList.remove('hidden');
      errorMessage.classList.add('hidden');
    } else {
      errorMessage.classList.remove('hidden');
      successMessage.classList.add('hidden');
      if (message) {
        errorText.textContent = message;
      }
    }
  }

  function hideFormStatus() {
    formStatus.classList.add('hidden');
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
  }

  /** @param {boolean} submitting */
  function setSubmitState(submitting) {
    if (submitting) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitText.textContent = 'Sending...';
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitText.textContent = 'Send Message';
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    clearAllErrors();
    hideFormStatus();

    const formData = new FormData(form);
    const gotcha = formData.get('_gotcha');
    if (typeof gotcha === 'string' && gotcha.trim() !== '') {
      return;
    }

    const lastSubmit = Number(sessionStorage.getItem(SUBMIT_COOLDOWN_KEY) || '0');
    if (Date.now() - lastSubmit < SUBMIT_COOLDOWN_MS) {
      showFormStatus('error', 'Please wait before sending another message.');
      return;
    }

    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    let isValid = true;

    if (!validateName(data.name)) {
      showError('name', 'Please enter a valid name (2-50 characters, letters only)');
      isValid = false;
    }

    if (!validateEmail(data.email)) {
      showError('email', 'Please enter a valid email address');
      isValid = false;
    }

    if (!validateSubject(data.subject)) {
      showError('subject', 'Subject must be between 3-100 characters');
      isValid = false;
    }

    if (!validateMessage(data.message)) {
      showError('message', 'Message must be between 10-1000 characters');
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    setSubmitState(true);

    try {
      const response = await fetch('https://formspree.io/f/xrbabznl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        sessionStorage.setItem(SUBMIT_COOLDOWN_KEY, String(Date.now()));
        showFormStatus('success');
        form.reset();

        setTimeout(() => {
          hideFormStatus();
        }, 5000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Form submission failed:', errorData);
        showFormStatus('error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showFormStatus('error', 'Network error. Please check your connection and try again.');
    } finally {
      setSubmitState(false);
    }
  });

  const nameField = document.getElementById('contact-name');
  const emailField = document.getElementById('contact-email');
  const subjectField = document.getElementById('contact-subject');
  const messageField = document.getElementById('contact-message');

  nameField?.addEventListener('blur', function() {
    if (this.value && !validateName(this.value)) {
      showError('name', 'Please enter a valid name (2-50 characters, letters only)');
    } else {
      clearError('name');
    }
  });

  emailField?.addEventListener('blur', function() {
    if (this.value && !validateEmail(this.value)) {
      showError('email', 'Please enter a valid email address');
    } else {
      clearError('email');
    }
  });

  subjectField?.addEventListener('blur', function() {
    if (this.value && !validateSubject(this.value)) {
      showError('subject', 'Subject must be between 3-100 characters');
    } else {
      clearError('subject');
    }
  });

  messageField?.addEventListener('blur', function() {
    if (this.value && !validateMessage(this.value)) {
      showError('message', 'Message must be between 10-1000 characters');
    } else {
      clearError('message');
    }
  });
}

const form = document.querySelector('#contact-form form');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const formStatus = document.getElementById('form-status');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

if (
  form instanceof HTMLFormElement &&
  submitBtn instanceof HTMLButtonElement &&
  submitText instanceof HTMLElement &&
  formStatus instanceof HTMLElement &&
  successMessage instanceof HTMLElement &&
  errorMessage instanceof HTMLElement &&
  errorText instanceof HTMLElement
) {
  initContactForm(form, submitBtn, submitText, formStatus, successMessage, errorMessage, errorText);
} else {
  console.warn('Contact form elements not found; contact form handler not initialized.');
}
