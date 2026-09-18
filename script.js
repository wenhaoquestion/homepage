// The page and navigation remain usable without JavaScript.
const mobileMenu = document.querySelector('.mobile-nav');
const menuToggle = mobileMenu?.querySelector('summary');

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.open = false;
    // A closed disclosure should not retain focus on its hidden link.
    const targetId = link.getAttribute('href');
    if (targetId?.startsWith('#')) {
      const target = document.querySelector(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu?.open) {
    mobileMenu.open = false;
    menuToggle?.focus();
  }
});

document.addEventListener('click', (event) => {
  if (mobileMenu?.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
});

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
