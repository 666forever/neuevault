const rollingSelector = [
  '.main-nav > a',
  '.sign-in',
  '.sign-in-mobile',
  '.collections-button',
  '.hero-cta',
  '.text-link',
  '.back-link',
  '.load-more',
  '.modal-actions .button',
  '.auth-dialog-card > .button:not(.auth-close)',
].join(',');

const iconSelector = '.nav-control-icon, .hero-cta-icon';

function createTextRoll(label) {
  const viewport = document.createElement('span');
  viewport.className = 'roll-text';
  const primary = document.createElement('span');
  primary.className = 'roll-text-layer'; primary.textContent = label;
  const duplicate = primary.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  viewport.append(primary, duplicate);
  return viewport;
}

function createIconRoll(icon) {
  const viewport = document.createElement('span');
  viewport.className = 'roll-icon'; viewport.setAttribute('aria-hidden', 'true');
  const primary = document.createElement('span');
  primary.className = 'roll-icon-layer'; primary.append(icon);
  const duplicate = primary.cloneNode(true);
  viewport.append(primary, duplicate);
  return viewport;
}

export function enhanceRollingControls(root = document) {
  root.querySelectorAll(rollingSelector).forEach(control => {
    if (control.disabled || control.classList.contains('has-roll-animation')) return;
    if (control.matches('.sign-in, .sign-in-mobile') && control.dataset.userIdentity === 'true') return;
    const label = control.textContent.trim();
    if (!label) return;
    const icon = control.querySelector(`:scope > ${iconSelector}`);
    control.replaceChildren();
    if (icon) control.append(createIconRoll(icon));
    control.append(createTextRoll(label));
    control.classList.add('has-roll-animation');
    if (!control.hasAttribute('aria-label')) control.setAttribute('aria-label', label);
  });
}
